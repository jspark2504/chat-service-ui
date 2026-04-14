export interface ChatMessage {
  id?: number;
  roomId: string;
  senderId: string;
  content: string;
  timestamp?: string;
}

export interface ChatRoom {
  id: string;
  title: string;
  peerUserId?: string;
  createdAt?: string;
}
