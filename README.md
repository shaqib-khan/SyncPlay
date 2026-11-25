# SyncPlay – YouTube Watch Party System

> **Real-Time YouTube Watch Party Platform with Synchronized Playback, Role-Based Access Control, Shared Video Queue, Live Party Chat, and Instant Guest Rooms.**

Built as a full-stack MERN + Socket.IO application.

---

## 🎬 What Was Built in This Project

- **Real-Time Authoritative YouTube Synchronization**
  - Uses the official YouTube IFrame Player API wrapped in a `forwardRef` + `useImperativeHandle` imperative controller (`VideoPlayer.jsx`) so Socket.IO `player_play`, `player_pause`, `player_seek`, `change_video`, and `sync_state` events execute directly on the player without React re-render lag.
  - Echo prevention via `isRemoteSyncRef`, pending command queueing before player `onReady`, automatic drift correction (`> 1.5s` / `> 2.5s`), latency-adjusted timestamps (`getAdjustedTime()`), monotonic `stateVersion` tracking, and browser autoplay fallback with an interactive audio-unlock prompt.
- **Watch Room Creation, Joining & Tab-Safe Sessions**
  - Create a room with a display name, room name, and any YouTube URL or 11-character video ID (parsed via `new URL()` across `watch`, `youtu.be`, `shorts`, `live`, `embed`, and query-heavy links).
  - Join via 6-character room code or shareable `/join/:roomCode` invite link.
  - Tab-isolated room sessions (`sessionStorage` with `localStorage` fallback) so testing Host and Participant in separate tabs of the same browser never collides.
  - Resilient in-memory `RoomManager` when MongoDB is not configured, with safe room retention and Host reconnect restoration preserving the exact active `videoId`.
- **Role-Based Access Control (RBAC) & Approval Workflow**
  - Strict 3-tier hierarchy enforced on the backend: **Host** → **Moderator** → **Participant**.
  - Host can promote/demote Moderators, remove participants, and transfer Host ownership.
  - Participants can submit Play, Pause, Seek, Video Change, and Queue requests from `RequestPanel.jsx`; Host/Moderators approve or reject them in real time.
- **Synchronized Video Queue & Integrated Search**
  - Shared room queue supporting add, remove, reorder, shuffle, next-in-queue, and toggleable autoplay on video end.
  - Live YouTube search (YouTube Data API v3 + oEmbed metadata + fallback catalog) and instant video switching.
- **Modern Dark UI & Live Party Chat**
  - Consistent dark theme (`#111111`, `#181818`, `#202020`, `#242424`, `#32C443`, `#2885DB`, `#FF0033`), 16:9 desktop player with Default, Theater, and Fullscreen modes, and animated 3-step Getting Started cards.
  - Messenger-style live chat (`ChatBox.jsx`) with grouped consecutive message bubbles, color-coded initial avatars, role badges, emoji-only reactions, quick-reaction bar + emoji grid, unread message counter when scrolled up, and a fixed bottom composer.
- **Zero Mandatory Login & Inline Feedback**
  - Instant guest access with just a display name and non-intrusive inline status/error feedback.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Lucide React, React Router |
| **Backend** | Node.js, Express.js, Socket.IO 4 |
| **In-Memory Engine** | OOP State Machine (`RoomManager`, `Participant`, `MessageHandler`) |
| **Database** | MongoDB + Mongoose (with automatic in-memory fallback when `MONGO_URI` is unset) |
| **Video Playback** | Official YouTube IFrame Player API |
| **Video Metadata** | YouTube Data API v3 + YouTube oEmbed |
| **Testing** | Jest + Supertest |

---

## 📁 Repository Structure

```
YT watch Party System/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer.jsx            # Imperative YouTube IFrame API player & sync engine
│   │   │   ├── PlaybackControls.jsx       # Custom play/pause/seek bar, resync & local volume
│   │   │   ├── VideoQueuePanel.jsx        # Synchronized room queue & autoplay controls
│   │   │   ├── IntegratedVideoSearch.jsx  # In-room YouTube search & URL input
│   │   │   ├── RoomSearchModal.jsx        # Quick video search/change modal
│   │   │   ├── YouTubeThumbnail.jsx       # Thumbnail loader with fallbacks
│   │   │   ├── ParticipantList.jsx        # Live member list, role assignment & host transfer
│   │   │   ├── ParticipantCard.jsx        # Individual participant actions
│   │   │   ├── ChatBox.jsx                # Grouped live chat, avatars & emoji picker
│   │   │   ├── RequestPanel.jsx           # Participant request controls & Host/Mod approval UI
│   │   │   ├── Navbar.jsx                 # Top navigation bar
│   │   │   ├── GettingStarted.jsx         # 3-step animated onboarding section
│   │   │   └── RoleBadge.jsx              # Host / Moderator / Participant badges
│   │   ├── pages/                         # Home, CreateRoom, JoinRoom, WatchRoom
│   │   ├── context/                       # AuthContext & SocketContext
│   │   ├── services/                      # Axios API client (dynamic host resolution)
│   │   └── utils/                         # YouTube URL parser & helpers
├── backend/
│   ├── classes/
│   │   ├── RoomManager.js                 # In-memory room state, drift compensation & queue
│   │   ├── Participant.js                 # Participant model & RBAC permission checks
│   │   └── MessageHandler.js              # Chat formatting & optional DB persistence
│   ├── config/                            # MongoDB connection with in-memory fallback
│   ├── controllers/                       # Room, Auth, and Video controllers
│   ├── middleware/                        # JWT auth, error handling & rate limiting
│   ├── models/                            # Mongoose schemas (Room, User, Message)
│   ├── routes/                            # Express REST routes
│   ├── sockets/                           # Socket.IO room & playback sync handlers
│   └── tests/                             # Jest automated test suites (28 tests)
└── README.md
```

---

## 🔌 WebSocket & REST API Reference

### Client → Server Socket Events

| Event | Payload | Required Role | Description |
|---|---|---|---|
| `join_room` | `{ roomId, userId, username, role, videoId?, roomName? }` | None | Join room (or restore host room on reconnect) |
| `leave_room` | `{}` | None | Leave current room |
| `play` / `pause` / `seek` | `{ roomId, currentTime }` | Host, Mod | Broadcast playback state to room |
| `change_video` | `{ roomId, videoUrl }` | Host, Mod | Load a new YouTube video for all members |
| `request_resync` | `{}` | None | Request latest authoritative `sync_state` |
| `request_control` | `{ action, payload }` | Participant | Request playback or video change |
| `approve_request` / `reject_request` | `{ requestId }` | Host, Mod | Approve or reject participant request |
| `assign_role` | `{ targetUserId, newRole }` | Host | Promote/demote Moderator |
| `transfer_host` | `{ targetUserId }` | Host | Transfer Host role |
| `remove_participant` | `{ targetUserId }` | Host | Remove participant from room |
| `queue_add` / `queue_remove` / `queue_reorder` / `queue_play_next` / `queue_shuffle` / `queue_clear` / `toggle_autoplay` | Queue payloads | Host, Mod | Manage shared video queue |
| `send_message` | `{ message, type, emoji }` | Room member | Send chat message or reaction |

### REST Endpoints

- `GET /api/health` – Server health check
- `POST /api/rooms` – Create a new watch room
- `POST /api/rooms/join` – Join an existing room by code
- `GET /api/rooms/:roomId` – Fetch room state & participants
- `GET /api/rooms/:roomId/participants` – List room participants
- `GET /api/rooms/:roomId/messages` – Fetch room chat history
- `GET /api/videos/search?q=...` – Search YouTube videos
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` – Optional account endpoints

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Run Backend & Frontend
```bash
# Terminal 1 – Backend (port 5000)
cd backend
npm run dev

# Terminal 2 – Frontend (port 5173)
cd frontend
npm run dev
```

### 3. Run Automated Tests
```bash
cd backend
npm test
```
Runs 28 Jest tests across `tests/room.test.js` and `tests/watchPartyScenarios.test.js` covering room lifecycle, playback synchronization, late-join time compensation, RBAC permissions, request approvals, queue operations, multi-room isolation, and disconnect/reconnect handling.
