"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";

type Props = {
  messages: ChatMessage[];
  selfId: string | null;
};

export function MessageList({ messages, selfId }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#B2C7D9] px-3 py-3">
      {messages.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-600">메시지를 입력해 대화를 시작하세요.</p>
      )}
      {messages.map((m, i) => {
        const mine = selfId !== null && m.senderId === selfId;
        return (
          <div key={`${m.senderId}-${i}-${m.content.slice(0, 20)}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                mine ? "rounded-br-md bg-[#FEE500] text-neutral-900" : "rounded-bl-md bg-white text-neutral-900"
              }`}
            >
              {!mine && <p className="mb-1 text-[11px] font-medium text-[#4A6FA5]">{m.senderId}</p>}
              <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
