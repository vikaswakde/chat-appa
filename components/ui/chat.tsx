'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { PaperclipIcon, StopCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function Chat({
  id,
  initialMessages,
}: {
  id?: string | undefined;
  initialMessages?: Message[];
} = {}) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    setMessages,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    // Throttle the messages and data updates to 50ms:
    experimental_throttle: 25,
    id, // use the provided chat id
    initialMessages, // initial messages if provided
    sendExtraMessageFields: true, // send id and createdAt for each message

    // only send the last message to the server: (if you want to reduce the load on the server)
    experimental_prepareRequestBody({messages, id}){
      return { message: messages[messages.length - 1], id}
    },
  });

  useAutoResume({
    autoResume: true,
    initialMessages: messages,
    experimental_resume,
    data,
    setMessages
  })

  // state to hold the files
  const [files, setFiles] = useState<FileList | undefined>(undefined);

  // ref to the file input field
  const fileInputRef = useRef<HTMLInputElement>(null);

  // delete specific message (whatsapp inspired)
  const deleteMessage = (id: string) => {
    //update state with new filtered messages
    setMessages(messages.filter((message) => message.id !== id));
  };

  return (
    <div className="flex flex-col w-full max-w-2xl py-24 mx-auto stretch">
      {messages.map((message) => (
        // show messages
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? "User: " : "AI: "}

          {message.parts.map((part, index) => {
            // text parts
            if (part.type === "text") {
              return (
                <div key={`${message.id}-${index}`}>
                  {part.type === "text" ? part.text : null}

                  <Button
                    onClick={() => deleteMessage(message.id)}
                    variant="outline"
                  >
                    Delete
                  </Button>

                  <Button
                    onClick={() => reload()}
                    disabled={!(status === "ready" || status === "error")}
                    variant="outline"
                  >
                    Regenerate
                  </Button>
                </div>
              );
            }

            // reasoning parts
            if (part.type === "reasoning") {
              return (
                <pre
                  key={`${message.id}-${index}`}
                  className="flex flex-col gap-2 whitespace-normal py-3   border  font-serif leading-7"
                >
                  {part.details.map((detail) =>
                    detail.type === "text" ? detail.text : "<redacted>"
                  )}
                </pre>
              );
            }

            // sources parts
            if (part.type === "source") {
              message.parts
                .filter((part) => part.type === "source")
                .map((part) => (
                  <span key={`source-${part.source.id}`}>
                    [
                    <Link href={part.source.url} target="_blank">
                      {part.source.title ?? new URL(part.source.url).hostname}
                    </Link>
                    ]
                  </span>
                ));
            }

            // image generatins parts
            if (part.type === "file" && part.mimeType.startsWith("image/")) {
              return (
                <Image
                  key={`${message.id}-${index}`}
                  src={`data:${part.mimeType};base64,${part.data}`}
                  alt={`generated-image-${index}`}
                  width={500}
                  height={500}
                  className="rounded-lg"
                />
              );
            }
          })}

          {/* show images or pdfs */}
          <div>
            {message?.experimental_attachments
              ?.filter(
                (attachment) =>
                  attachment?.contentType?.startsWith("image/") ||
                  attachment?.contentType?.startsWith("application/pdf")
              )
              .map((attachment, index) =>
                attachment.contentType?.startsWith("image/") ? (
                  <Image
                    key={`${message.id}-${index}`}
                    src={attachment.url}
                    width={500}
                    height={500}
                    alt={attachment.name ?? `attachment-${index}`}
                    className="rounded-lg"
                  />
                ) : attachment.contentType?.startsWith("application/pdf") ? (
                  <iframe
                    key={`${message.id}-${index}`}
                    src={attachment.url}
                    width={500}
                    height={500}
                    className="rounded-lg"
                    title={attachment.name ?? `attachment-${index}`}
                  />
                ) : null
              )}
          </div>
        </div>
      ))}

      {(status === 'submitted' || status === 'streaming') && (
        <div className="text-center p-4">loading...</div>
      )}

      {error && toast.error("An error occurred")}

      <form
        className="fixed bottom-0 w-full max-w-2xl mb-8 border border-gray-700 rounded-xl shadow-xl p-2"
        onSubmit={(event) => {
          handleSubmit(event, {
            experimental_attachments: files,
          });

          setFiles(undefined);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      >
        <Input
          className="w-full p-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Let's ask a question..."
          disabled={status !== "ready" && status !== "error"}
        />

        <div className="flex items-center gap-2 justify-between pt-2">
          <Button
            type="submit"
            variant="outline"
            disabled={(status !== "ready" && status !== "error") || !input.trim()}
          >
            Ask
          </Button>

          <div className="relative">
            <Input
              type="file"
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  setFiles(event.target.files);
                }
              }}
              multiple
              ref={fileInputRef}
              accept="image/*, application/pdf"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <PaperclipIcon className="w-4 h-4" />
              {files
                ? `${files.length} file${
                    files.length !== 1 ? "s" : ""
                  } selected`
                : "Attach files"}
            </Button>
          </div>

          {(status === "submitted" || status === "streaming") && (
            <Button type="button" onClick={stop} variant="destructive">
              <StopCircleIcon className="w-4 h-4" color="white" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
