# AI Business Operations SaaS (OpsAI)

Production-style V1 full-stack SaaS application to help businesses manage incoming leads, analyze leads using AI, assign leads to employees, generate follow-up messages, import leads from CSV, and view business analytics.

## Tech Stack
* **Frontend**: React 19, React Router 7, Tailwind CSS v4, Axios, Recharts (planned)
* **Backend**: Node.js 22, Express 5 (ES Modules), dotenv, CORS
* **Database**: MongoDB & Mongoose (planned for next milestone)
* **AI**: Google Gemini API (planned for next milestone)

## Project Structure
```text
project/
├── client/          # React 19 + Tailwind v4 + Vite Frontend
│   ├── src/
│   │   ├── api/     # Reusable Axios HTTP client & API endpoints
│   │   ├── components/ # Layout (Navbar, Footer), Shared UI
│   │   ├── pages/   # Health check page, Blueprint page, 404
│   │   ├── App.jsx  # React Router setup
│   │   └── main.jsx # React DOM entry point
├── server/          # Node.js 22 + Express 5 ES Module Backend
│   ├── src/
│   │   ├── config/  # Environment validation (.env)
│   │   ├── controllers/ # HTTP route handlers
│   │   ├── routes/  # Express routers (/api/health)
│   │   ├── app.js   # Express app, CORS, error handling
│   │   └── server.js # Server listener
└── package.json     # Workspace management scripts
```

## Running Locally

### 1. Start the Backend Server (Port 5000)
```bash
cd server
npm run dev
# or from root:
npm run dev:server
```
Test health check directly in browser or terminal: `http://localhost:5000/api/health`

### 2. Start the Frontend Client (Port 5173)
```bash
cd client
npm run dev
# or from root:
npm run dev:client
```
Open `http://localhost:5173` to view the live system health check dashboard.
