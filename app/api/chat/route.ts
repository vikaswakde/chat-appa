import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { Message, streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
    const openrouter = createOpenRouter({
        apiKey: `${process.env.OPEN_ROUTER_API_KEY}`
    })

    const {messages}: {messages: Message[]} = await req.json()

    // check if user has sent an Image
    const messagesHaveImages = messages.some(message => 
        message.experimental_attachments?.some(
            a => a.contentType?.startsWith('image/')
        ),
    );

    const result = streamText({
        model: 
        messagesHaveImages 
        ? openrouter('google/gemini-2.0-flash-exp:free')
        : openrouter('deepseek/deepseek-r1-0528-qwen3-8b:free'),
        messages
    })

    return result.toDataStreamResponse({
        sendReasoning: true,

        // only providers like perplexity and google generative ai currenlty support them
        sendSources: true
    })
}