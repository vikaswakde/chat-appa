import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { Message, streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
    const openrouter = createOpenRouter({
        apiKey: `${process.env.OPEN_ROUTER_API_KEY}`
    })

    const {messages}: {messages: Message[]} = await req.json()

    const result = streamText({
        model: openrouter('google/gemini-2.0-flash-exp:free'),
        messages
    })

    return result.toDataStreamResponse()
}