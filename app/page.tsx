"use client";
import { useChat } from "@ai-sdk/react";
import Image from "next/image";
import { useRef, useState } from "react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  // state to hold the files
  const [files, setFiles] = useState<FileList | undefined>(undefined);

  // ref to the file input field
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col w-full max-w-lg py-24 mx-auto stretch">
      {messages.map((m) => (
        // show messages
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === "user" ? "User: " : "AI: "}
          {m.content}

          {/* show images */}
          <div>
            {m?.experimental_attachments
              ?.filter((attachment) =>
                attachment?.contentType?.startsWith("image/")
              )
              .map((attachment, index) => (
                <Image
                  key={`${m.id}-${index}`}
                  src={attachment.url}
                  width={500}
                  height={500}
                  alt={attachment.name ?? `attachment-${index}`}
                  className="rounded-lg"
                />
              ))}
          </div>
        </div>
      ))}

      <form
        className="fixed bottom-0 w-full max-w-md mb-8 border border-gray-300 rounded shadow-xl"
        onSubmit={event => {
          handleSubmit(event, {
            experimental_attachments: files
          });

          setFiles(undefined);

          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      >
        <input
          type="file"
          className=""
          onChange={event => {
            if (event.target.files) {
              setFiles(event.target.files);
            }
          }}
          multiple
          ref={fileInputRef}
        />
        <input
          className="w-full p-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Let's ask a question..."
        />
      </form>
    </div>
  );
}
