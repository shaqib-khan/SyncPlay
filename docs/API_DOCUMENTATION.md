# SyncPlay – API Documentation

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://your-backend.render.com/api`

## Authentication

Protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained via `/auth/register` or `/auth/login` and are valid for 7 days.

---

## REST Endpoints

### Health Check

#### `GET /health`

Returns server status.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "service": "SyncPlay Backend"
}
```

---

### Authentication

#### `POST /auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",       // 3-20 chars, alphanumeric + underscore
  "email": "john@example.com", // valid email
  "password": "secret123"      // min 6 chars
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "",
    "isGuest": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error 400:** Validation failed  
**Error 400:** Username/email already exists

---

#### `POST /auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Error 401:** Invalid credentials

---

#### `GET /auth/me`

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "user": {
    "userId": "...",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

---

### Rooms

#### `POST /rooms`

Create a new watch party room.

**Auth:** Optional (guests can create rooms)

**Request Body:**
```json
{
  "username": "johndoe",         // required if not authenticated
  "roomName": "Friday Movie Night",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response 201:**
```json
{
  "message": "Room created successfully",
  "room": {
    "roomId": "AB3X7K",
    "roomName": "Friday Movie Night",
    "videoId": "dQw4w9WgXcQ",
    "hostId": "guest_uuid-here",
    "playState": "paused",
    "participants": [...]
  },
  "userId": "guest_uuid-here",
  "username": "johndoe"
}
```

**Error 400:** Invalid YouTube URL  
**Error 400:** Validation failed

---

#### `POST /rooms/join`

Join an existing room by code.

**Auth:** Optional

**Request Body:**
```json
{
  "username": "janedoe",
  "roomId": "AB3X7K"
}
```

**Response 200:**
```json
{
  "message": "Joined room successfully",
  "room": {
    "roomId": "AB3X7K",
    "roomName": "Friday Movie Night",
    "videoId": "dQw4w9WgXcQ",
    "playState": "paused",
    "currentTime": 42.5,
    "stateVersion": 7,
    "participants": [...]
  },
  "userId": "...",
  "username": "janedoe",
  "role": "participant"
}
```

**Error 404:** Room not found or no longer active

---

#### `GET /rooms/:roomId`

Get room details.

**Response 200:**
```json
{
  "room": {
    "roomId": "AB3X7K",
    "roomName": "Friday Movie Night",
    "hostId": "...",
    "videoId": "dQw4w9WgXcQ",
    "playState": "paused",
    "currentTime": 42.5,
    "stateVersion": 7,
    "participants": [...],
    "roomStatus": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error 404:** Room not found

---

#### `GET /rooms/:roomId/participants`

Get current participant list.

**Response 200:**
```json
{
  "participants": [
    {
      "userId": "...",
      "username": "johndoe",
      "role": "host",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "isConnected": true
    }
  ]
}
```

---

#### `GET /rooms/:roomId/messages`

Get chat message history (last 100 messages).

**Response 200:**
```json
{
  "messages": [
    {
      "_id": "...",
      "roomId": "AB3X7K",
      "senderId": "...",
      "senderName": "johndoe",
      "senderRole": "host",
      "message": "Hello everyone!",
      "type": "chat",
      "emoji": null,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Videos

#### `GET /videos/search?q=:query`

Search YouTube videos via YouTube Data API v3 (when configured) or curated verified video collection.

**Query Parameters:**
- `q`: Search keyword or direct YouTube link / video ID.

**Response 200:**
```json
{
  "results": [
    {
      "id": "Way9Dexny3w",
      "title": "Dune: Part Two | Official Trailer",
      "channel": "Warner Bros.",
      "duration": "2:24",
      "category": "Entertainment"
    }
  ],
  "source": "curated"
}
```

---

## WebSocket Events Reference

### Connection

Connect to: `ws://localhost:5000` (or `wss://` in production)

```javascript
import { io } from 'socket.io-client'
const socket = io('http://localhost:5000', { transports: ['websocket'] })
```

---

### Client → Server Events

#### `join_room`

Join a room and receive current state.

```json
{
  "roomId": "AB3X7K",
  "userId": "user_id_or_guest_id",
  "username": "johndoe",
  "role": "participant"
}
```

#### `play`

```json
{ "roomId": "AB3X7K", "currentTime": 42.5 }
```
*Permission: host, moderator*

#### `pause`

```json
{ "roomId": "AB3X7K", "currentTime": 42.5 }
```
*Permission: host, moderator*

#### `seek`

```json
{ "roomId": "AB3X7K", "currentTime": 120.0 }
```
*Permission: host, moderator*

#### `change_video`

```json
{ "roomId": "AB3X7K", "videoUrl": "https://youtube.com/watch?v=newVideoId" }
```
*Permission: host, moderator*

#### `assign_role`

```json
{ "targetUserId": "user_id", "newRole": "moderator" }
```
*Permission: host only*

#### `remove_participant`

```json
{ "targetUserId": "user_id" }
```
*Permission: host only*

#### `request_control`

```json
{ "action": "play", "payload": { "currentTime": 42.5 } }
```
*Permission: participant (submits request)*

#### `approve_request`

```json
{ "requestId": "uuid-here" }
```
*Permission: host, moderator*

#### `reject_request`

```json
{ "requestId": "uuid-here" }
```
*Permission: host, moderator*

#### `send_message`

```json
{ "message": "Hello!", "type": "chat", "emoji": null }
```
*Permission: anyone in room*

#### `transfer_host`

```json
{ "targetUserId": "user_id" }
```
*Permission: host only*

#### `queue_add`
Add video item to the synchronized room queue.
```json
{ "video": { "videoId": "Way9Dexny3w", "title": "Dune 2 Trailer", "channel": "Warner Bros." } }
```
*Permission: host/moderator adds directly; participant routes to approval request*

#### `queue_remove`
```json
{ "queueId": "q_12345" }
```
*Permission: host, moderator*

#### `queue_reorder`
```json
{ "fromIndex": 1, "toIndex": 0 }
```
*Permission: host, moderator*

#### `queue_play_next`
Advance playback to the first item in the queue.
*Permission: host, moderator*

#### `queue_clear`
Clear all queued items.
*Permission: host, moderator*

---

### Server → Client Events

#### `sync_state`

Broadcast after any playback change.

```json
{
  "roomId": "AB3X7K",
  "videoId": "dQw4w9WgXcQ",
  "playState": "playing",
  "currentTime": 42.5,
  "stateVersion": 8,
  "hostId": "...",
  "participants": [...]
}
```

#### `user_joined`

```json
{
  "userId": "...",
  "username": "janedoe",
  "role": "participant",
  "participants": [...]
}
```

#### `user_left`

```json
{ "userId": "...", "username": "janedoe", "participants": [...] }
```

#### `role_assigned`

```json
{
  "userId": "...",
  "username": "janedoe",
  "newRole": "moderator",
  "assignedBy": "johndoe",
  "participants": [...]
}
```

#### `participant_removed`

```json
{
  "userId": "...",
  "username": "janedoe",
  "participants": [...],
  "reason": "Removed by host."
}
```

#### `control_requested`

Sent to host and moderators only.

```json
{
  "requestId": "uuid",
  "userId": "...",
  "username": "janedoe",
  "action": "play",
  "payload": { "currentTime": 42.5 },
  "status": "pending"
}
```

#### `request_approved`

```json
{
  "requestId": "uuid",
  "action": "play",
  "approvedBy": "johndoe",
  "message": "Your request was approved!"
}
```

#### `request_rejected`

```json
{
  "requestId": "uuid",
  "action": "play",
  "message": "Your request was rejected."
}
```

#### `receive_message`

```json
{
  "_id": "...",
  "roomId": "AB3X7K",
  "senderId": "...",
  "senderName": "johndoe",
  "senderRole": "host",
  "message": "Hello!",
  "type": "chat",
  "emoji": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### `host_transferred`

```json
{
  "newHostId": "...",
  "newHostName": "janedoe",
  "previousHostId": "...",
  "participants": [...]
}
```

#### `room_error`

```json
{ "message": "You do not have permission to play." }
```

