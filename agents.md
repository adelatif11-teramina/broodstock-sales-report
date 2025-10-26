# Repository Guidelines

## Project Structure & Module Organization
The project is split into `backend/` (Node.js API) and `frontend/` (Next.js
app). Backend source lives in `backend/src`, with configuration under `config/
`, request logic in `routes/`, shared helpers in `utils/`, and database
scripts in `migrations/`. Integration artifacts such as file uploads stay
in `backend/uploads`. Frontend code sits in `frontend/src`, organized around
the Next.js app router (`app/`), reusable `components/`, shared state in
`contexts/`, custom hooks in `hooks/`, and utility helpers in `lib/`. General
documentation belongs in `docs/`, while operational helpers (for example,
`scripts/init-db.sh`) are under `scripts/`.

## Build, Test, and Development Commands
Spin up the full stack with `docker-compose up -d`; it provisions Postgres/
PostGIS, Redis, MinIO, and both services. Run backend locally via `cd backend
&& npm install && npm run dev`; build with `npm run build` and launch the
compiled server using `npm start`. Database migrations execute through `npm
run migrate:run` inside the backend container or local environment. The
frontend starts with `cd frontend && npm install && npm run dev`, builds using
`npm run build`, and serves production assets via `npm start`. Linting and
formatting are available in both packages through `npm run lint`, `npm run
lint:fix`, `npm run format`, and `npm run format:check`.

## Coding Style & Naming Conventions
TypeScript is required across services. Prettier and ESLint enforce a two-
space indent, trailing semicolons, and single quotes. Favor `camelCase`
for variables/functions, `PascalCase` for React components and TypeScript
types, and kebab-case for file names except Next.js route folders. Keep route
handlers lean—business logic belongs in dedicated service modules. Always
update and reference `.env` values expected by `backend/src/config/env.ts`.

## Testing Guidelines
Backend testing uses Jest with Supertest. Place specs under `backend/tests`
or co-located `*.test.ts` files, and execute them with `npm run test` (or `npm
run test:watch` during development). Database-dependent tests should target
the Dockerized Postgres instance to mirror production settings. Frontend
testing is not yet wired; propose the tooling and configuration in your PR
before adding UI specs. Document any coverage targets and report gaps in the
PR description.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) tied to a single
concern; reference issue IDs when available. Feature work should land through
dedicated branches. Every pull request needs a clear summary, a checklist of
commands run (tests, linting, migrations), and updated docs or screenshots for
UI-facing changes. Highlight any configuration changes and call out security-
sensitive updates so reviewers can focus accordingly.

## Security & Configuration Tips
Secrets stay out of source control—use `.env` templates and keep production
values in your secrets manager. The API exposes `/uploads` only for local
storage; audit new file-handling code for validation and access control.
Database containers bootstrap PostGIS through `scripts/init-db.sh`; verify
extensions are present before running migrations against a fresh environment,
and rotate JWT secrets whenever auth-related code changes.