# AI Autonomous Task Platform

A full-stack AI task workspace where a set of specialized agents work through a user request from planning to final delivery. The app lets users create tasks, watch the agent workflow run in real time, review the generated output, and track task history and analytics from a dashboard.

## What it does

- Runs a multi-agent workflow with planner, memory, research, optimizer, critic, and final response agents
- Streams live task progress through Socket.IO
- Stores tasks, user accounts, agent logs, conversations, and uploaded documents in MongoDB
- Supports JWT-based authentication with protected dashboard routes
- Includes a workspace view for task creation, live agent events, workflow status, logs, and Markdown export
- Tracks execution stats such as tokens, runtime, confidence score, and completed tasks

## Tech stack

**Frontend**

- React 18
- Vite
- React Router
- TanStack Query
- Zustand
- Socket.IO client
- Tailwind CSS
- Framer Motion
- Recharts

**Backend**

- Node.js
- Express
- MongoDB with Mongoose
- Socket.IO
- JWT authentication
- Groq SDK
- Winston logging
- Multer and PDF parsing for document uploads

## Project structure

```text
.
├── backend
│   ├── src
│   │   ├── agents
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── socket
│   │   └── server.js
│   └── package.json
└── frontend
    ├── src
    │   ├── components
    │   ├── hooks
    │   ├── pages
    │   ├── store
    │   ├── styles
    │   └── utils
    └── package.json
```

## Getting started

Install dependencies in both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create `backend/.env` from the example file:

```bash
cp backend/.env.example backend/.env
```

Fill in the MongoDB connection string, JWT secret, and Groq API key.

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:5173`, and the backend defaults to `http://localhost:5001`.

## Environment variables

The backend expects:

```text
PORT=5001
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads/
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

## Notes

This project is set up as a development build. Before deploying it, use production secrets, restrict CORS to the deployed frontend domain, and configure persistent storage for uploads and logs.

