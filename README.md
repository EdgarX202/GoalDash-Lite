# GoalDash Lite

GoalDash Lite is a desktop web prototype for tracking financial goals, recording contributions, and visualising progress through XP, levels, achievements, and milestones.

Built as a learning and portfolio project with Python, FastAPI, React, and TypeScript.

**This app records progress only. It does not connect to a bank, transfer money, or process recurring payments.**

## Features

- **Accounts:** register, sign in, sign out, change your display name, and change your password.
- **Personal goals:** create, edit, and delete goals with a category, target amount, optional deadline, and priority.
- **Contributions:** manually record an amount and date, view contribution history, and edit or delete entries.
- **Dashboard:** view active and completed goal totals, contributed and remaining amounts, priority goals, and a category chart.
- **Goal browsing:** switch between active and completed goals and sort by date created, priority, target, or category.
- **Progression:** earn XP, advance through levels, and track three achievements.
- **Milestones:** see checkpoints at 25%, 50%, 75%, and 100%, with the amount needed for the next checkpoint.
- **Persistence:** accounts and goal data are stored locally in SQLite and survive server restarts.

The prototype is designed for desktop browsers. Mobile optimisation is outside this version's scope.

## Technology and dependencies

| Area | Technologies |
| --- | --- |
| Backend | Python 3.14, FastAPI, Uvicorn |
| Validation | Pydantic through FastAPI, email-validator |
| Password hashing | pwdlib with Argon2 |
| Database | SQLite through Python's built-in `sqlite3` module |
| Frontend | React 19, TypeScript 6, React Router 7 |
| Frontend tooling | Vite 8, ESLint 10, npm |
| Python tooling | uv |
| Backend tests | pytest, HTTPX, FastAPI TestClient |

Python dependencies are declared in `pyproject.toml` and locked in `uv.lock`. Frontend dependencies are declared in `frontend/package.json` and locked in `frontend/package-lock.json`.

You do not need to install SQLite separately or run a database server.

## Prerequisites

Install the following before starting:

- **Git**, if cloning the repository.
- **uv**, for managing Python and backend dependencies.
- **Node.js 24.x with npm**, which satisfies the checked-in frontend tooling's requirements.
- A modern desktop web browser.

The project pins **Python 3.14** in `.python-version`. The setup below installs it through uv if needed.

The commands assume you have permission to use the project under its licence. See [Licence](#licence).

## Installation

### 1. Obtain the project

Copy the clone URL from this repository's GitHub **Code** button. Replace `YOUR_REPOSITORY_URL` below with that URL:

```sh
git clone YOUR_REPOSITORY_URL GoalDash_Lite
cd GoalDash_Lite
```

If you already have the project, open a terminal in its root folder instead. This is the folder containing `pyproject.toml`.

### 2. Install the backend dependencies

From the project root:

```sh
uv python install 3.14
uv sync --locked
```

This creates a local `.venv` and installs the locked Python dependencies, including the default development group used for testing.

There is no need to activate the virtual environment when using `uv run`.

### 3. Install the frontend dependencies

```sh
cd frontend
npm ci
```

`npm ci` installs the dependencies recorded in `package-lock.json`.

**Windows PowerShell:** if PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm` in every command in this README. For example:

```powershell
npm.cmd ci
```

### 4. Configure the frontend

Inside `frontend`, copy `.env.example` to `.env.local`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```sh
cp .env.example .env.local
```

The file should contain:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

This is also the frontend's default API address. Restart Vite after changing this file. Frontend environment variables prefixed with `VITE_` are exposed to the browser; do not put passwords or other secrets in them.

## Run the app

Run the backend and frontend in **two separate terminals**. Keep both running while using the app.

### Terminal 1: backend

From the project root:

```sh
uv run python -m uvicorn GoalDash_Lite.main:app --reload --host localhost --port 8000
```

The database and its tables are created automatically on startup at:

```text
data/goaldash.db
```

### Terminal 2: frontend

From the project root:

```sh
cd frontend
npm run dev -- --host localhost --port 5173 --strictPort
```

Open **[http://localhost:5173](http://localhost:5173)**.

| Address | Purpose |
| --- | --- |
| [localhost:5173](http://localhost:5173) | Web app |
| [localhost:8000](http://localhost:8000) | Backend health message |
| [localhost:8000/docs](http://localhost:8000/docs) | Interactive API documentation |

Use `localhost` consistently rather than mixing it with `127.0.0.1`. The current CORS and request-origin settings expect the frontend at `http://localhost:5173`. `--strictPort` stops Vite from silently choosing a different port.

Press **Ctrl+C** in each terminal to stop the servers.

## How to use GoalDash Lite

### Create an account

1. Select **Create an account** on the sign-in page.
2. Enter your display name, email, password, and password confirmation.
3. Use a password between **15 and 128 characters**.
4. After registering, sign in to access your dashboard.

Each account has its own goals. Sessions expire after 24 hours.

### Create a goal

1. Open **Goals**.
2. Select **+ New goal**.
3. Enter a name, such as “Emergency fund”.
4. Choose **Savings**, **Debt**, or **Other**.
5. Enter a target in pounds, such as `1000` or `1000.50`.
6. Optionally choose a deadline and set the priority.
7. Select **Create goal**.

The web app accepts amounts in pounds and displays GBP. The API stores monetary amounts as whole-number pence: for example, £1,000 is `100000` pence.

### Record and manage contributions

Select **Add contribution** on a goal and enter the amount and date manually.

Expand **Contribution history** to view previous entries or edit and delete them. Changing an entry updates the goal's contributed total and progress.

A goal is completed automatically when its contributed total reaches or exceeds its target. Find it under the **Completed** filter. If an edit reduces progress below the target, it becomes active again.

Use **Edit goal** to change a goal's details. Deleting a goal also deletes its contributions; there is no undo feature.

### View your progress

The **Home** page shows your goal totals, up to three priority goals, XP progress, and a category overview. Select a category to inspect its target, contributed amount, and remaining amount.

The category chart represents each category's share of total goal targets, including completed goals.

### Manage your account

Open **Account** to update your display name or change your password.

Changing your password requires the current password and signs you out of all existing sessions. Sign in again using the new password.

Your email is read-only in this prototype. Forgotten-password recovery and email verification are not implemented.

## XP, achievements, and milestones

| Activity | XP |
| --- | ---: |
| A distinct contribution date across all your goals | 10 |
| A completed goal | 50 |

Multiple contributions on the same date count as one contribution date, even across different goals. Contribution size does not change the date reward.

Users start at **Level 1**, with a new level every **100 XP**. For example, 150 total XP means Level 2 with 50 XP towards Level 3.

| Achievement | Requirement |
| --- | --- |
| First step | Record a first contribution |
| Building momentum | Record contributions on three distinct dates; they need not be consecutive |
| Goal achieved | Complete a first goal |

Each goal also has milestones at **25%, 50%, 75%, and 100%**. Achievements and milestones do not award extra XP.

**Progression is calculated from current saved records.** Editing or deleting goals or contributions can reduce XP, lower a level, or lock an achievement again. Refreshing a page does not award additional XP.

## Run checks

Run the backend tests from the project root:

```sh
uv run python -m pytest -q
```

The tests use temporary databases rather than your normal app database. They cover goal and contribution behaviour, persistence, password hashing, sessions, password changes, and account isolation.

Run frontend linting and the TypeScript/production build from `frontend`:

```sh
npm run lint
npm run build
```

These commands are checks, not a claim that the project has complete test coverage.

## Preview the built frontend

Stop the frontend development server first so port 5173 is available. Leave the backend running.

From `frontend`:

```sh
npm run build
npm run preview -- --host localhost --port 5173 --strictPort
```

Open [http://localhost:5173](http://localhost:5173).

Preview serves the built frontend locally; it does not start the API or provide a production deployment. If you change the frontend environment configuration, rebuild before previewing.

## Configuration

| Setting | Where | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `frontend/.env.local` | `http://localhost:8000` | Backend URL used by the frontend |
| `SESSION_COOKIE_SECURE` | Backend process environment | `false` | Set to `true` when serving session cookies over HTTPS |

For local HTTP development, leave `SESSION_COOKIE_SECURE` unset or `false`.

The backend reads `SESSION_COOKIE_SECURE` from its process environment; it does not automatically load a backend `.env` file.

Allowed origins are currently defined in:

- `src/GoalDash_Lite/main.py` — CORS configuration.
- `src/GoalDash_Lite/auth_dependencies.py` — trusted origins for requests that change data.

If you intentionally change the frontend host or port, update both configurations to match the exact origin and restart the backend.

## Troubleshooting

### “Failed to fetch”

- Confirm that both servers are running.
- Open [localhost:8000](http://localhost:8000) to check the backend.
- Confirm that the frontend uses `http://localhost:8000` as its API URL.
- Open the app at `http://localhost:5173`, not another port or hostname.
- Restart Vite after changing `.env.local`, or rebuild if using preview.

### “Request origin is not allowed”

Use the frontend at `http://localhost:5173` and Swagger at `http://localhost:8000/docs`. The backend rejects writes from origins not in its trusted-origin list.

When using an API client outside the browser, write requests also need an allowed `Origin` header and protected endpoints need a signed-in session cookie.

### `uv trampoline failed to canonicalize script path`

This can occur when an environment contains stale paths after moving or renaming the project.

The documented launch command uses `python -m uvicorn` to avoid the Uvicorn launcher script. On Windows, you can also run the virtual environment's Python directly from the project root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn GoalDash_Lite.main:app --reload --host localhost --port 8000
```

If the environment is still broken, stop the servers, rename `.venv` to `.venv-old`, and run `uv sync --locked` to create a fresh environment. Keep `data/goaldash.db` in place to preserve your accounts and goals.

### uv hardlink warning

uv may fall back to copying files when its cache and the project are on different drives. This warning alone does not mean installation failed. You can explicitly use copying:

```sh
uv sync --locked --link-mode copy
```

### Port 5173 is already in use

Stop the previous development or preview server, then rerun the command. Avoid switching ports without updating the backend's allowed origins.

### A £1,000 goal appears as £10

When using Swagger, `target_pence` is in pence. Send `100000` for £1,000. The website's form performs this conversion for you.

### My session expired

Refresh the page and sign in again. Password changes invalidate existing sessions immediately.

## Project structure

```text
GoalDash_Lite/
├── frontend/
│   ├── src/                  # React pages, forms, and components
│   ├── .env.example          # Example API URL configuration
│   ├── package.json
│   └── package-lock.json
├── src/
│   └── GoalDash_Lite/
│       ├── routers/          # Account, goal, and progression endpoints
│       ├── main.py           # FastAPI app and startup
│       ├── database.py       # SQLite connection and table setup
│       ├── repository.py     # Goal and contribution persistence
│       ├── auth_repository.py
│       ├── auth_dependencies.py
│       ├── auth_schemas.py
│       ├── schemas.py
│       ├── security.py       # Password hashing
│       ├── sessions.py       # Session storage and expiry
│       ├── goal_access.py    # Goal ownership checks
│       └── progression.py    # XP and achievement calculations
├── tests/
├── data/                     # Created at startup; ignored by Git
├── .python-version
├── pyproject.toml
├── uv.lock
├── LICENSE.md
└── README.md
```

## Prototype scope

This version is a local learning and portfolio prototype, not a production-ready financial service.

- No bank integration, payments, or automatic recurring contributions.
- No mobile-specific layout or native mobile app.
- No email verification or forgotten-password recovery.
- No reward shop, virtual currency, or avatar customisation.
- No AI-generated financial summaries or suggestions.

Authentication uses hashed passwords and server-side sessions. Public deployment would require further security and operational work, including HTTPS, abuse protection, account recovery, and deployment configuration.

## Licence

Copyright © 2026 Edgar Park. All rights reserved.

This repository is not released under an open-source licence. The current [LICENSE.md](LICENSE.md) requires the copyright holder's express prior written permission to use, copy, modify, or distribute the project. These setup instructions do not grant additional rights.

