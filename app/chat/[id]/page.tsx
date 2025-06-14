import Chat from "@/components/ui/chat";
import { loadChat } from "@/app/tools/chat-store";

export default async function Page(props: {params: Promise<{id: string}>}) {
    const {id} = await props.params // get the chatID from the  URL

    const messages = await loadChat(id); // load the chat messages
    return <Chat id={id} initialMessages={messages} />   
}