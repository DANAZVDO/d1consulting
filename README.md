# D1 Growth Suite

Transformar o CRM em um departamento de marketing completo para PMEs.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite/Turso (prototype), PostgreSQL (production)
- **AI:** OpenAI API (GPT-4o / GPT-4o mini)
- **CRM Backend:** GoHighLevel API v3

## Project Structure

```
d1consulting/
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── ...
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Auth, tenant, error handling
│   │   ├── services/     # GHL, AI, WhatsApp integrations
│   │   └── utils/        # Helpers, validation
│   ├── tests/
│   └── package.json
├── database/          # Schema & migration files
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v20+
- npm v9+

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables

See `backend/.env.example` for required variables.

## API Documentation

- **Port 3000:** Frontend (served by backend or standalone)
- **Port 8000:** Backend API (private, proxied through port 3000)

## Database

The database schema is defined in `database/schema.sql`. For local development,
SQLite is used via Turso for sync-enabled prototyping.