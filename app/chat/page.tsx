"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatRoomList } from "@/components/ChatRoomList";
import { ChatWindow } from "@/components/ChatWindow";
import {
  clearAuthSession,
  createChatRoom,
  fetchChatRooms,
  fetchRoomMessages,
  getToken,
  getUserId,
  getUsername,
} from "@/lib/api";
import { useChat } from "@/hooks/useChat";
import type { ChatMessage, ChatRoom } from "@/types/chat";

function ActiveChatRoom({
  roomId,
  senderId,
  roomTitle,
  initialMessages,
}: {
  roomId: string;
  senderId: string;
  roomTitle: string;
  initialMessages: ChatMessage[];
}) {
  const { messages, connected, socketError, sendMessage } = useChat(roomId, senderId, initialMessages);
  return (
    <ChatWindow
      roomTitle={roomTitle}
      messages={messages}
      selfId={senderId}
      connected={connected}
      socketError={socketError}
      onSend={sendMessage}
    />
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [createRoomLoading, setCreateRoomLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [senderId, setSenderId] = useState<string | null>(null);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getUserId() ?? getUsername();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    setSenderId(user);
  }, [router]);

  const loadRooms = useCallback(async () => {
    if (!getToken()) return;
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      const list = await fetchChatRooms();
      setRooms(list.map((r) => ({ id: r.id, title: r.title, peerUserId: r.peerUserId, createdAt: r.createdAt })));
      setSelectedRoomId((prev) => prev ?? (list[0]?.id ?? null));
    } catch {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      setRoomsError("채팅방 목록을 불러오지 못했습니다.");
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;
    void loadRooms();
  }, [loadRooms]);

  const loadMessages = useCallback(
    async (roomId: string) => {
      if (!getToken()) return;
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const messages = await fetchRoomMessages(roomId, 50, 0);
        setMessagesByRoom((prev) => ({ ...prev, [roomId]: messages }));
      } catch {
        if (!getToken()) {
          router.replace("/login");
          return;
        }
        setMessagesError("메시지 목록을 불러오지 못했습니다.");
      } finally {
        setMessagesLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!selectedRoomId) return;
    void loadMessages(selectedRoomId);
  }, [selectedRoomId, loadMessages]);

  const onCreateRoom = async (otherUserId: number) => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setCreateRoomLoading(true);
    setRoomsError(null);
    try {
      const room = await createChatRoom({ otherUserId });
      setRooms((prev) => {
        const exists = prev.some((r) => r.id === room.id);
        if (exists) return prev;
        return [{ id: room.id, title: room.title, peerUserId: room.peerUserId, createdAt: room.createdAt }, ...prev];
      });
      setSelectedRoomId(room.id);
      await loadMessages(room.id);
    } catch {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      setRoomsError("채팅방 생성에 실패했습니다.");
    } finally {
      setCreateRoomLoading(false);
    }
  };

  const selectedTitle = rooms.find((r) => r.id === selectedRoomId)?.title ?? null;

  const logout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  if (!senderId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#B2C7D9] text-sm text-neutral-600">확인 중…</div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#A8B8C8]">
      <div className="flex shrink-0 items-center justify-end gap-2 border-b border-black/10 bg-white px-3 py-2">
        <span className="mr-auto text-xs text-neutral-500">{senderId}</span>
        <button
          type="button"
          onClick={() => void loadRooms()}
          className="rounded-md border border-black/10 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          새로고침
        </button>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-black/10 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          로그아웃
        </button>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1">
        <ChatRoomList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
          onCreateRoom={onCreateRoom}
          loading={roomsLoading}
          createLoading={createRoomLoading}
          error={roomsError}
        />
        {selectedRoomId ? (
          <ActiveChatRoom
            key={selectedRoomId}
            roomId={selectedRoomId}
            senderId={senderId}
            roomTitle={selectedTitle ?? `채팅방 ${selectedRoomId}`}
            initialMessages={messagesByRoom[selectedRoomId] ?? []}
          />
        ) : (
          <ChatWindow
            roomTitle={null}
            messages={[]}
            selfId={senderId}
            connected={false}
            socketError={messagesError ?? (messagesLoading ? "메시지 불러오는 중…" : null)}
            onSend={() => {}}
          />
        )}
      </div>
    </div>
  );
}
