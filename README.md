# 💬 Real-Time Chat App

A full-stack real-time chat application inspired by WhatsApp Web. Built with **Node.js**, **Express**, **MongoDB**, **Socket.IO** on the backend and **React 19**, **Vite**, **TailwindCSS**, **Zustand** on the frontend.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Socket Events](#-socket-events)
- [Database Models](#-database-models)
- [End-to-End Encryption](#-end-to-end-encryption-e2ee)
- [Deployment](#-deployment)

---

## ✨ Features

### 💬 Messaging
- **Real-time messaging** via WebSockets (Socket.IO)
- **Group chats** — create groups, manage members, assign admins
- **Media messages** — send images, videos, files, and voice notes
- **Reply to messages** — quote a specific message in your reply
- **Edit & delete messages** — edit text or soft-delete any message you sent
- **Forward messages** — forward any message to any contact or group
- **Emoji reactions** — react to messages with 6 emoji options
- **Rich text formatting** — `*bold*`, `_italic_`, `~strikethrough~`, backtick `code` backtick
- **Link previews** — URLs automatically show a card with title, description, and image
- **Typing indicators** — see when someone is typing (1-on-1 and groups)
- **Read receipts** — single check (sent), double check (delivered), blue double check (read)
- **Unread message badges** — count of unread messages per conversation
- **Message search** — search within a conversation
- **Infinite scroll** — load older messages as you scroll up (pagination)

### 🔐 Authentication
- **Email/password registration** with **email verification** (6-digit OTP code)
- **JWT authentication** via HTTP-only cookies (access + refresh tokens)
- **Google OAuth** — sign in with your Google account
- **Auto logout** on cookie expiry

### 👤 User & Profile
- **User profile** — update name, status, and avatar
- **Custom chat wallpaper** — set a personal background for all conversations
- **End-to-end encryption (E2EE)** for 1-on-1 chats using RSA-OAEP + AES-GCM (WebCrypto API)
- **Contact system** — add contacts by username or email
- **Block / Unblock users** — blocked users cannot send you messages
- **Mute conversations** — silence notifications for specific chats
- **Online presence** — green dot shows when a user is online

### 🎨 UI / UX
- **WhatsApp-inspired design** — familiar and intuitive layout
- **Dark / Light mode** toggle
- **Fully responsive** — works on mobile, tablet, and desktop
- **Mobile-app navigation** — sidebar slides in/out on small screens

### 📹 Video & Voice Calls
- **1-on-1 video calls** using WebRTC peer-to-peer connections
- **Voice calls** (audio-only mode)
- Signaling through Socket.IO

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | HTTP server and REST API |
| MongoDB + Mongoose | Database and ODM |
| Socket.IO 4 | Real-time WebSocket server |
| JWT (jsonwebtoken) | Authentication tokens |
| bcrypt | Password hashing |
| Cloudinary | Media file storage (images, videos, audio, files) |
| Multer | Multipart file upload handling |
| Nodemailer | Sending email verification codes |
| Google Auth Library | Verifying Google OAuth tokens |
| link-preview-js | Fetching Open Graph data for URL previews |

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| Vite 7 | Build tool and dev server |
| TailwindCSS 4 | Utility-first styling |
| Zustand 5 | Global state management |
| Socket.IO Client 4 | Real-time WebSocket client |
| Axios | HTTP API client |
| React Router DOM 7 | Client-side routing |
| Lucide React | Icon library |
| @react-oauth/google | Google OAuth button |
| react-hot-toast | Toast notifications |
| WebCrypto API | E2EE encryption/decryption (browser built-in) |

---

## 📁 Project Structure

```
chat/
├── backend/
│   ├── controller/
│   │   ├── user.js             # Auth, profile, contacts, block/mute
│   │   ├── message.js          # Send, edit, delete, react, read receipts
│   │   └── group.js            # Create and manage groups
│   ├── model/
│   │   ├── user.model.js
│   │   ├── message.model.js    # Supports E2EE fields
│   │   └── group.model.js
│   ├── route/
│   │   ├── user.js             # /api/auth/* routes
│   │   ├── message.js          # /api/messages/* routes
│   │   └── group.route.js      # /api/groups/* routes
│   ├── socket/
│   │   └── socket.js           # Socket.IO server, rooms, all events
│   ├── middleware/
│   │   └── auth.middleware.js  # JWT verification
│   ├── utility/
│   │   ├── asyncHandler.js
│   │   ├── apiError.js
│   │   ├── apiResponse.js
│   │   ├── cloudinary.js
│   │   └── sendEmail.js
│   ├── app.js                  # Express app, CORS, middleware
│   ├── index.js                # Server entry point
│   └── .env                    # Environment variables (not committed)
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js        # Axios instance with interceptors
    │   ├── components/
    │   │   ├── ChatWindow.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── MessageItem.jsx
    │   │   ├── MessageInput.jsx
    │   │   ├── CreateGroupModal.jsx
    │   │   ├── ForwardModal.jsx
    │   │   ├── ProfileModal.jsx
    │   │   ├── ProfileViewer.jsx
    │   │   ├── MediaViewer.jsx
    │   │   └── VideoCallManager.jsx
    │   ├── pages/
    │   │   ├── ChatDashboard.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── VerifyEmailPage.jsx
    │   ├── store/
    │   │   ├── useAuthStore.js
    │   │   ├── useChatStore.js
    │   │   ├── useSocketStore.js
    │   │   ├── useCallStore.js
    │   │   └── useThemeStore.js
    │   ├── lib/
    │   │   └── crypto.js       # RSA/AES key generation and E2EE helpers
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher — https://nodejs.org/
- **npm** v9 or higher (comes with Node.js)
- A **MongoDB** database (local or MongoDB Atlas — https://www.mongodb.com/atlas)
- A **Cloudinary** account — https://cloudinary.com/
- A **Gmail** account (for sending OTP verification emails)
- A **Google Cloud** project with OAuth 2.0 credentials (for Google Sign-In)

---

### Backend Setup

1. Navigate to the backend folder:

```bash
cd chat/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create the `.env` file and fill in your values (see Environment Variables section below).

4. Start the backend server:

```bash
npm run dev
```

The server starts on `http://localhost:4000`. It uses nodemon so it auto-restarts on file changes.

---

### Frontend Setup

1. Navigate to the frontend folder:

```bash
cd chat/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chatapp

# Server
PORT=4000
NODE_ENV=development

# JWT Secrets
ACCESS_TOKEN=your_access_token_secret_here
REFRESS_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESS_TOKEN_EXPIRY=10d

# Cloudinary (media storage)
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# CORS — set to your frontend URL
ORIGIN_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Email (Gmail SMTP)
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
```

> Never commit your `.env` file to Git. It is already in `.gitignore`.

### How to get each value

| Variable | Where to get it |
|---|---|
| MONGO_URI | MongoDB Atlas > Create Cluster > Connect > Drivers |
| CLOUDINARY_NAME / KEY / SECRET | Cloudinary Dashboard > Settings > API Keys |
| GOOGLE_CLIENT_ID | Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client |
| SMTP_USER | Your Gmail address |
| SMTP_PASS | Google Account > Security > App Passwords > Mail |

---

## 📡 API Reference

All routes are prefixed with `/api`.

### Auth — /api/auth

| Method | Route | Auth Required | Description |
|--------|-------|:---:|-------------|
| POST | /register | No | Register with name, username, email, password |
| POST | /verify-email | No | Submit the 6-digit OTP to verify email |
| POST | /login | No | Login with email and password |
| POST | /logout | Yes | Logout and clear cookies |
| POST | /google-auth | No | Login or register with Google credential |
| GET | /me | Yes | Get currently logged-in user data |
| GET | /users | Yes | Get contacts list. Add ?search= to search all users globally |
| POST | /add-contact | Yes | Add a user as a contact by username or email |
| PUT | /profile/update | Yes | Update name, status, avatar, wallpaper, or publicKey |
| POST | /block/:userId | Yes | Block a user |
| POST | /unblock/:userId | Yes | Unblock a user |
| POST | /mute/:userId | Yes | Toggle mute on a conversation |

---

### Messages — /api/messages

| Method | Route | Auth Required | Description |
|--------|-------|:---:|-------------|
| GET | /:id | Yes | Fetch messages. Params: ?skip=0 &limit=50 &search= &isGroup=true |
| POST | /send/:id | Yes | Send a message. Add ?isGroup=true for group messages |
| PUT | /edit/:id | Yes | Edit a message (your own messages only) |
| DELETE | /delete/:id | Yes | Soft-delete a message (your own messages only) |
| POST | /react/:id | Yes | Add or toggle an emoji reaction |
| POST | /mark-read/:id | Yes | Mark messages from a sender as read |
| GET | /unread-counts | Yes | Get unread count per conversation |

**Multipart form fields for /send:**

| Field | Type | Description |
|-------|------|-------------|
| text | string | Message text |
| image | file | Image attachment |
| video | file | Video attachment |
| file | file | Document attachment |
| audio | file | Voice note (webm) |
| replyTo | string | _id of the message being quoted |
| isForwarded | string | Pass "true" if forwarding |

---

### Groups — /api/groups

| Method | Route | Auth Required | Description |
|--------|-------|:---:|-------------|
| POST | /create | Yes | Create a group with name, members array, optional avatar |
| GET | /:groupId | Yes | Get full group details with populated member list |
| PUT | /:groupId/update | Yes | Update group name, description, or avatar (admins only) |
| POST | /:groupId/add | Yes | Add new members (admins only) |
| DELETE | /:groupId/remove/:userId | Yes | Remove a member or leave the group |
| PUT | /:groupId/assign-admin/:userId | Yes | Promote a member to admin |

---

## ⚡ Socket Events

Connect to the socket server with your userId in the handshake query:

```js
const socket = io('http://localhost:4000', {
  query: { userId: 'your_user_id' }
});
```

### Server → Client (events you listen to)

| Event | Payload | Description |
|-------|---------|-------------|
| getOnlineUsers | string[] | Array of currently online user IDs |
| newMessage | Message | New message received in current chat or group |
| messageEdited | Message | A message was edited |
| messageDeleted | Message | A message was deleted |
| messageReacted | Message | An emoji reaction was added or changed |
| messagesRead | { readerId } | The other person read your messages |
| newGroupCreated | Group | You were added to a newly created group |
| groupUpdated | Group | A group you belong to was modified |
| typing | { senderId } | Someone started typing |
| stopTyping | { senderId } | Someone stopped typing |
| incomingCall | { from, offer, isVideoCall } | Incoming WebRTC call |
| callAccepted | { answer } | Your outgoing call was accepted |
| iceCandidate | { candidate } | WebRTC ICE candidate exchange |
| callEnded | — | The active call was ended |

### Client → Server (events you emit)

| Event | Payload | Description |
|-------|---------|-------------|
| joinGroup | groupId | Join a group socket room to receive messages |
| typing | { receiverId, isGroup } | Broadcast that you are typing |
| stopTyping | { receiverId, isGroup } | Broadcast that you stopped typing |
| callUser | { userToCall, offer, from, isVideoCall } | Initiate a WebRTC call |
| answerCall | { to, answer } | Accept an incoming call |
| iceCandidate | { to, candidate } | Send ICE candidate to peer |
| endCall | { to } | End the active call |

---

## 🗄 Database Models

### User Model

| Field | Type | Description |
|-------|------|-------------|
| username | String | Unique username |
| fullName | String | Display name |
| email | String | Unique email address |
| password | String | Hashed with bcrypt |
| avtar | String | Cloudinary avatar URL |
| status | String | "About" bio text |
| chatWallpaper | String | Custom chat background URL |
| contacts | ObjectId[] | Array of contact user IDs |
| blockedUsers | ObjectId[] | Array of blocked user IDs |
| mutedUsers | ObjectId[] | Array of muted user IDs |
| publicKey | String | RSA public key for E2EE |
| isVerified | Boolean | Whether email is verified |
| verificationCode | String | One-time email OTP |
| verificationCodeExpires | Date | OTP expiry time |
| REFRESH_TOKEN | String | Stored refresh token |

### Message Model

| Field | Type | Description |
|-------|------|-------------|
| senderId | ObjectId | Sender user reference |
| receiverId | ObjectId | Recipient for 1-on-1 chat |
| groupId | ObjectId | Group reference for group messages |
| text | String | Message text (may be encrypted ciphertext) |
| image | String | Cloudinary image URL |
| video | String | Cloudinary video URL |
| fileUrl | String | Cloudinary document URL |
| fileName | String | Original file name |
| audioUrl | String | Cloudinary voice note URL |
| replyTo | ObjectId | Reference to the quoted message |
| reactions | Array | [ { userId, emoji } ] |
| status | Enum | sent / delivered / read |
| isEdited | Boolean | Whether message was edited |
| isDeleted | Boolean | Soft-deleted flag |
| isForwarded | Boolean | Whether message was forwarded |
| linkPreview | Object | { title, description, image, url } |
| iv | String | AES-GCM IV in Base64 (E2EE) |
| encryptionKeys | Array | [ { userId, encryptedKey } ] (E2EE) |

### Group Model

| Field | Type | Description |
|-------|------|-------------|
| name | String | Group display name |
| description | String | Group description |
| avtar | String | Group avatar Cloudinary URL |
| members | ObjectId[] | All member user IDs |
| admins | ObjectId[] | Admin user IDs |
| createdBy | ObjectId | Creator user reference |

---

## 🔒 End-to-End Encryption (E2EE)

1-on-1 messages use **hybrid encryption** with the browser-native Web Crypto API:

**Step 1 — Key Setup (first login)**
- An RSA-OAEP-2048 key pair is generated in the browser
- The private key is saved in **IndexedDB** and never leaves the device
- The public key is uploaded to the server and stored with the user profile

**Step 2 — Sending an encrypted message**
- A random **AES-GCM-256** session key is generated per message
- The message text is encrypted with this AES key
- The AES key is then encrypted separately with both the sender's AND receiver's RSA public keys
- The encrypted text + IV + two encrypted AES keys are sent to the server

**Step 3 — Receiving and decrypting**
- The receiver fetches their encrypted AES key from the message
- They decrypt the AES key using their private RSA key (from IndexedDB)
- They use the decrypted AES key to decrypt the message text

**What the server sees:** only ciphertext and encrypted keys — it cannot read the message content.

> Group messages are NOT end-to-end encrypted. They are stored in plain text on the server.

---

## 🌐 Deployment

### Deploy Backend (Railway / Render)

1. Push code to GitHub
2. Connect the repo to Railway (https://railway.app) or Render (https://render.com)
3. Add all environment variables from the section above in the platform dashboard
4. Set `NODE_ENV=production`
5. Set `ORIGIN_URL` to your deployed frontend URL

### Deploy Frontend (Vercel)

1. Push code to GitHub
2. Import the repo in Vercel (https://vercel.com)
3. Set Root Directory to `frontend`
4. Vercel auto-detects Vite and runs `npm run build`
5. Update the backend URL in `src/api/axios.js` and `src/store/useSocketStore.js` to point to your deployed backend

---

## 📜 Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| npm run dev | Start server with nodemon (auto-restart on save) |

### Frontend

| Command | Description |
|---------|-------------|
| npm run dev | Start Vite dev server at localhost:5173 |
| npm run build | Build production bundle to dist/ |
| npm run preview | Preview the production build locally |
| npm run lint | Run ESLint checks |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: git checkout -b feature/your-feature
3. Commit your changes: git commit -m "Add some feature"
4. Push to the branch: git push origin feature/your-feature
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

Built with love by Akash Kumar Kushwaha
