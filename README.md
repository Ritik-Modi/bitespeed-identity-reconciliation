# Bitespeed Identity Reconciliation

Backend service for the Bitespeed Identity Reconciliation task.

## Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM

## Project Structure

- `src/routes`: HTTP route definitions
- `src/controllers`: request/response handlers
- `src/services`: identity reconciliation business logic
- `src/repositories`: database access methods
- `src/utils`: response consolidation helpers
- `prisma`: schema and migrations

## Prerequisites

- Node.js 18+
- Docker Desktop (recommended for local PostgreSQL)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Start PostgreSQL:

```bash
docker compose up -d db
```

4. Apply migrations:

```bash
npx prisma migrate dev --name init
```

5. Start API:

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

## API Contract

### POST `/identify`

Request body:

```json
{
  "email": "doc@fluxkart.com",
  "phoneNumber": "123456"
}
```

Validation:

- At least one of `email` or `phoneNumber` is required.
- If provided, fields must be strings.
- Send request payload as JSON body only (`Content-Type: application/json`).
- Do not send `form-data`.

Response:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["doc@fluxkart.com", "doc+1@fluxkart.com"],
    "phoneNumbers": ["123456", "999999"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Business Rules Implemented

- Matching happens on `email OR phoneNumber`.
- Oldest contact in a connected cluster remains primary.
- New unseen info creates a secondary contact linked to the primary.
- If one request connects multiple primaries, the oldest stays primary and others are demoted to secondary.
- Merge and create operations run inside one transaction.
- Response values are unique and ordered with primary values first.

## Quick Verification (cURL)

1. New identity:

```bash
curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"doc@fluxkart.com","phoneNumber":"123456"}'
```

2. Existing identity by email:

```bash
curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"doc@fluxkart.com"}'
```

3. New secondary via new phone:

```bash
curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"doc@fluxkart.com","phoneNumber":"999999"}'
```

4. Primary merge case:

```bash
curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"a@x.com","phoneNumber":"111"}'
curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"b@x.com","phoneNumber":"222"}'
curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"a@x.com","phoneNumber":"222"}'
```

## Docker Usage

```bash
docker compose up --build
```

## Publish to GitHub

1. Create an empty GitHub repository (example: `bitespeed-identity-reconciliation`).
2. Push this local project:

```bash
git init
git add .
git commit -m "chore: bootstrap identity reconciliation service"
git remote add origin https://github.com/<your-username>/bitespeed-identity-reconciliation.git
git branch -M main
git push -u origin main
```

3. Continue making small commits with clear intent, for example:

```bash
git add src/services/identity.service.ts
git commit -m "feat: handle primary-cluster merge in single transaction"

git add src/middlewares/validation.middleware.ts
git commit -m "feat: enforce JSON input validation for identify payload"

git add README.md
git commit -m "docs: document deployment and endpoint usage"
```

## Deploy on Render

This repo includes [`render.yaml`](/Users/ritikmodi/Documents/Projects/bitespeed/render.yaml) for Blueprint deploy.

1. Push repository to GitHub.
2. In Render, click `New` -> `Blueprint` and select this repo.
3. Render will create:
- A free PostgreSQL database
- A web service with build/start commands
4. After deploy, add your live endpoint URL below.

Live endpoint:

`POST https://<your-render-service>.onrender.com/identify`

## Submission Notes

- `POST /identify` is the only required endpoint for this task.
- Schema includes indexes on `email`, `phoneNumber`, and `linkedId`.
- Merge logic preserves deterministic primary selection by `createdAt`, then `id`.
