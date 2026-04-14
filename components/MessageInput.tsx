"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (disabled) return;
    onSend(value);
    setValue("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-black/10 bg-white px-3 py-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="메시지를 입력하세요"
        className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[#4A6FA5] disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-[#F5DC00] disabled:cursor-not-allowed disabled:opacity-40"
      >
        전송
      </button>
    </form>
  );
}
