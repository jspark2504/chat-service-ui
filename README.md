# Chat Service UI

JWT 인증 기반의 1:1 실시간 채팅 프론트엔드입니다.  
Next.js(App Router) + React + TypeScript + Tailwind + Axios + WebSocket으로 구성되어 있습니다.

## 주요 기능

- 회원가입 / 로그인
- 로그인 상태 기반 라우팅 (`/login` 또는 `/chat` 이동)
- 채팅방 목록 조회
- 새 채팅방 생성 (`otherUserId` 입력)
- 채팅방 메시지 히스토리 조회
- WebSocket 실시간 송수신
- WebSocket 재연결 백오프
- 401 응답 시 세션 자동 정리

## 기술 스택

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Axios

## 시작하기

### 1) 설치

```bash
npm install
```

### 2) 환경변수 설정 (선택)

프로젝트 루트에 `.env.local` 파일을 만들고 필요 시 아래 값을 설정하세요.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws/chat
NEXT_PUBLIC_AUTH_LOGIN_PATH=/api/users/login
NEXT_PUBLIC_AUTH_REGISTER_PATH=/api/users/register
```

설정하지 않으면 위 값들이 기본값으로 사용됩니다.

### 3) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 라우트 구성

- `/` : 토큰 존재 여부를 보고 `/chat` 또는 `/login`으로 리다이렉트
- `/login` : 로그인 페이지
- `/register` : 회원가입 페이지
- `/chat` : 채팅 메인 페이지

## 인증 규약

- 로그인 응답에서 받은 JWT를 `localStorage`에 저장
- REST 요청: `Authorization: Bearer <token>`
- WebSocket 연결: `ws://.../ws/chat?token=<urlencoded-jwt>`
- REST 401 응답 수신 시 저장된 인증 정보 자동 삭제

저장 키:

- `token`
- `username`
- `userId`

## 백엔드 API 계약

기본 Base URL: `http://localhost:8080`

### 공개 API

- `POST /api/users/register`
- `POST /api/users/login`

### 보호 API (JWT 필요)

- `POST /api/chat/rooms`  
  body: `{ "otherUserId": 2 }`
- `GET /api/chat/rooms`
- `GET /api/chat/rooms/{roomId}/messages?limit=50&page=0`

## WebSocket 메시지 계약

연결 URL: `ws://localhost:8080/ws/chat?token=<urlencoded-jwt>`

클라이언트 -> 서버

```json
{ "type": "CHAT", "chatRoomId": 10, "content": "hello" }
```

서버 -> 클라이언트 (채팅)

```json
{
  "type": "CHAT",
  "messageId": 101,
  "chatRoomId": 10,
  "senderId": 1,
  "content": "hello",
  "timestamp": "2026-04-15T12:34:56"
}
```

서버 -> 클라이언트 (에러)

```json
{ "type": "ERROR", "code": "SOME_CODE", "message": "..." }
```

## 동작 메모

- 현재 새 채팅 생성 UI는 `otherUserId`(숫자) 직접 입력 방식입니다.
- `username` 기반 시작을 원하면 백엔드 확장이 필요합니다.
  - 예: `POST /api/chat/rooms`에서 `otherUsername` 지원
  - 또는 `GET /api/users?query=` 검색 API 제공
- 메시지 렌더링은 `timestamp` 우선 정렬, 동률 시 `id` 순으로 정렬합니다.

## 사용 가능한 스크립트

- `npm run dev` : 개발 서버 실행
- `npm run build` : 프로덕션 빌드
- `npm run start` : 프로덕션 서버 실행
- `npm run lint` : ESLint 검사
