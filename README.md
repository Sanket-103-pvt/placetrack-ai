# PlaceTrack AI

Full-stack placement management and student-readiness platform for KK Wagh-style engineering placement workflows.

The app includes a Next.js frontend, Express/TypeScript API, Prisma/PostgreSQL database, JWT auth, role-based dashboards, placement drives, applications, interviews, aptitude tests, resume analysis, CSV reports, and seed data based on the engineering placement profile:

- Highest package: up to Rs 25 LPA
- Average package target: Rs 4.8 - Rs 5.97 LPA for common service-sector drives
- Placement rate target: 80% - 90%
- Recruiters: NVIDIA, TCS, Infosys, Wipro, IBM, Persistent Systems, Crompton Greaves, and related engineering/IT companies

## Current status

Implemented:

- Student/coordinator/admin sign-in
- Student sign-up
- JWT authentication
- Role authorization
- Student dashboard
- Coordinator/admin analytics
- Drive listing and eligibility
- Student applications
- Application status updates
- Interview scheduling API
- Aptitude tests and submissions
- Resume text/PDF analysis with Gemini optional fallback
- Local PostgreSQL Docker setup
- KK Wagh engineering seed data
- Backend unit tests

## Quick start

Requirements:

- Node.js 20+
- npm
- Docker Desktop

```bash
npm install
docker compose up -d
npm run prisma:push -w backend
npm run prisma:seed -w backend
npm run dev
```

Open:

- Frontend: http://localhost:3000
- API: http://localhost:4000
- Health check: http://localhost:4000/health

## Demo credentials

Password for all demo accounts:

```text
Demo@123
```

Accounts:

- Student: `student@placetrack.ai`
- Coordinator: `coordinator@placetrack.ai`
- Admin: `admin@placetrack.ai`

Additional seeded students:

- `student2@placetrack.ai` through `student500@placetrack.ai`

## Environment

Root `.env` and `backend/.env` are used for local API/database settings.

Frontend uses:

```text
frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Gemini is optional. If `GEMINI_API_KEY` is missing or fails, resume/interview AI falls back to local heuristic logic.

## Useful commands

```bash
npm run dev
npm run build
npm run typecheck
npm test
npm run prisma:push -w backend
npm run prisma:seed -w backend
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | API and database health |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/signup` | Create student account |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Role-aware dashboard |
| GET | `/api/drives` | Placement drives |
| POST | `/api/drives` | Create drive |
| GET | `/api/applications` | Applications |
| POST | `/api/applications` | Apply to drive |
| PATCH | `/api/applications/:id/status` | Update application status |
| POST | `/api/applications/:id/interview` | Schedule interview |
| GET | `/api/tests` | Aptitude tests |
| GET | `/api/tests/:id` | Test questions |
| POST | `/api/tests/:id/submit` | Submit test |
| POST | `/api/ai/resume/text` | Analyze resume text |
| POST | `/api/ai/resume/upload` | Analyze PDF/text resume |
| POST | `/api/ai/interview` | Generate interview questions |
| GET | `/api/reports/applications.csv` | Export applications CSV |
| GET | `/api/reports/students.csv` | Export students CSV |

## Notes

- `docker-compose.yml` is pinned to `postgres:13.0` because that image was already available locally. Change it back to a newer Postgres image if Docker Hub pull works on your machine.
- Prisma `generate` may fail on Windows if a Node/dev process is locking the query engine DLL. Stop dev servers and rerun if needed.
