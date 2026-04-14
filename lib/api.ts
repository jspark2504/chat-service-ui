import axios, { type AxiosInstance } from "axios";

const TOKEN_KEY = "token";
const USERNAME_KEY = "username";
const USER_ID_KEY = "userId";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return getStoredToken();
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function setAuthSession(token: string, username: string, userId?: number): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
  if (typeof userId === "number") {
    localStorage.setItem(USER_ID_KEY, String(userId));
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401) {
        clearAuthSession();
      }
      if (axios.isAxiosError(error)) {
        const message =
          typeof error.response?.data === "object" &&
          error.response?.data &&
          "message" in error.response.data &&
          typeof (error.response.data as { message?: unknown }).message === "string"
            ? ((error.response?.data as { message: string }).message ?? "요청 처리 중 오류가 발생했습니다.")
            : error.message;
        throw new Error(message);
      }
      throw error;
    },
  );

  return client;
}

const client = createClient();

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  userId?: number;
  username?: string;
}

export async function login(username: string, password: string): Promise<string> {
  const path = process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH ?? "/api/users/login";
  const { data } = await client.post<LoginResponse>(path, { username, password });
  const token = data.accessToken ?? data.token ?? data.access_token;
  if (!token) {
    throw new Error("로그인 응답에 토큰이 없습니다.");
  }
  setAuthSession(token, data.username ?? username, data.userId);
  return token;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export async function register({ username, password }: RegisterRequest): Promise<void> {
  const path = process.env.NEXT_PUBLIC_AUTH_REGISTER_PATH ?? "/api/users/register";
  await client.post(path, { username, password });
}

export interface CreateChatRoomRequest {
  otherUserId: number;
}

export interface ChatRoomResponse {
  id: number;
  peerUserId: number;
  createdAt?: string;
  title?: string;
}

export interface MessageResponse {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  timestamp?: string;
}

type NormalizedRoom = { id: string; title: string; peerUserId?: string; createdAt?: string };

function normalizeRoom(raw: Record<string, unknown>): NormalizedRoom | null {
  const id = raw.id ?? raw.roomId;
  if (id == null) return null;
  const title =
    typeof raw.title === "string"
      ? raw.title
      : typeof raw.name === "string"
        ? raw.name
        : typeof raw.roomName === "string"
          ? raw.roomName
          : `채팅방 ${String(id)}`;
  const peerUserId = raw.peerUserId ?? raw.otherUserId;
  return {
    id: String(id),
    title,
    peerUserId: peerUserId != null ? String(peerUserId) : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}

export async function createChatRoom({
  otherUserId,
}: CreateChatRoomRequest): Promise<NormalizedRoom> {
  const { data } = await client.post<ChatRoomResponse>("/api/chat/rooms", { otherUserId });
  const normalized = normalizeRoom(data as unknown as Record<string, unknown>);
  if (!normalized) {
    throw new Error("채팅방 생성 응답이 올바르지 않습니다.");
  }
  return normalized;
}

export async function fetchChatRooms(): Promise<NormalizedRoom[]> {
  const { data } = await client.get<unknown>("/api/chat/rooms");
  const list = Array.isArray(data) ? data : (data as { rooms?: unknown }).rooms;
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((item) => (item && typeof item === "object" ? normalizeRoom(item as Record<string, unknown>) : null))
    .filter((r): r is NormalizedRoom => r !== null);
}

export async function fetchRoomMessages(roomId: string, limit = 50, page = 0) {
  const { data } = await client.get<unknown>(`/api/chat/rooms/${roomId}/messages`, {
    params: { limit, page },
  });
  const list = Array.isArray(data) ? data : (data as { items?: unknown; messages?: unknown }).items ?? (data as { messages?: unknown }).messages;
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const message = item as MessageResponse;
      return {
        id: message.id,
        roomId: String(message.chatRoomId),
        senderId: String(message.senderId),
        content: String(message.content ?? ""),
        timestamp: message.timestamp,
      };
    })
    .filter((m): m is { id: number; roomId: string; senderId: string; content: string; timestamp?: string } => m !== null);
}
