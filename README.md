# Product Price Tracker

A full-stack web application to track product prices and stock from the INE mock store.

## Tech Stack
* **Frontend**: React.js (Vite), Recharts, deployed on Vercel
* **Backend**: Node.js (Express), Playwright (for scraping), deployed on Render
* **Database**: Supabase (PostgreSQL)

## Setup Instructions

### Environment Variables
Create a `.env` file in the **backend** directory:
```
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_secret_key
HEADLESS=true
```

Create a `.env` file in the **frontend** directory:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally
1. Start the backend:
```bash
cd backend
npm install
node server.js
```
2. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

### Scraping Schedule
The scheduled scrapes are managed via an external cron service (like cron-job.org).
Set up the cron job to send a `POST` request to `/api/scrape` every 2 hours. The backend will return a quick 200 OK and execute the scraping job asynchronously in the background.
