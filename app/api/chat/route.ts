import { appendStreamId, loadChat, loadStreams, saveChat } from "@/app/tools/chat-store"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { appendClientMessage, appendResponseMessages, createDataStream, generateId, streamText, type Message } from "ai"
import { after } from "next/server"
import { createResumableStreamContext } from "resumable-stream"

export const maxDuration = 30

const streamContext = createResumableStreamContext({
    waitUntil: after
})

export async function POST(req: Request) {
    const openrouter = createOpenRouter({
        apiKey: `${process.env.OPEN_ROUTER_API_KEY}`
    })

    const { message, id }: { message: Message; id: string } = await req.json();

    // Load the previous messages from the server
    const previousMessages = await loadChat(id);

    // Append the new message to the previous messages
    const updatedMessagesWithUser = appendClientMessage({
        messages: previousMessages,
        message,
    });

    // Immediately save the user's message
    await saveChat({ id, messages: updatedMessagesWithUser });

    const streamId = generateId();
    await appendStreamId({ chatId: id, streamId });
    
    // check if user has sent an Image
    const messagesHaveImages = updatedMessagesWithUser.some(message => 
        message.experimental_attachments?.some(
            a => a.contentType?.startsWith('image/')
        ),
    );

    const stream = createDataStream({
        execute: (dataStream) => {
            const result = streamText({
                model: 
                messagesHaveImages 
                ? openrouter('google/gemini-2.0-flash-exp:free')
                : openrouter('deepseek/deepseek-r1-0528-qwen3-8b:free'),
                messages: updatedMessagesWithUser, 
        
                async onFinish({response}){
                    // Save the final messages with the AI response
                    await saveChat({
                        id, 
                        messages: appendResponseMessages({
                            messages: updatedMessagesWithUser,
                            responseMessages: response.messages
                        })
                    })
                }
            })
            result.mergeIntoDataStream(dataStream, { sendReasoning: true });
        }
    })

    return new Response(
        await streamContext.resumableStream(streamId, () => stream),
    )
}

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url)
    const chatId = searchParams.get('chatId')

    if (!chatId) {
        return new Response('id is required', {status: 400})
    }

    const streamIds = await loadStreams(chatId);

    const emptyDataStream = createDataStream({
        execute: () => {}
    })

    if (!streamIds.length) {
        return new Response(emptyDataStream, {status: 200});
    }

    const recentStreamId = streamIds.at(-1);

    if (!recentStreamId) {
        return new Response(emptyDataStream, {status: 200})
    }

    try {
        const stream = await streamContext.resumableStream(
            recentStreamId,
            // factory returns an empty stream if the stream is not found
            // (e.g. because it has been completed)
            () => emptyDataStream
        );
    
        // if the stream is found, pipe it to the response
        if (stream) {
            return new Response(stream, {status: 200})
        }
    } catch (e) {
        // an error indicates that the stream is broken or has been interrupted.
        // in this case, we fall back to the logic below.
        console.error('Failed to resume stream, falling back to last message.', e);
    }

    /*
    * For when the generation is 'active' during SSR but the 
    * resumable stream has concluded after reaching this point
    */

    const messages = await loadChat(chatId);
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage || mostRecentMessage.role !== "assistant") {
        return new Response(emptyDataStream, {status: 200})
    }

    const streamWithMessage = createDataStream({
        execute: buffer => {
            buffer.writeData({
                type: 'append-message',
                message: JSON.stringify(mostRecentMessage),
            })
        }
    })

    return new Response(streamWithMessage, {status: 200})
}