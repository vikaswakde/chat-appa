import { createChat } from "./tools/chat-store";
import { redirect } from "next/navigation";

export default async function Page() {
  const id = await createChat() // create a new chat
  redirect(`/chat/${id}`) // redirect to the new chat page
}
