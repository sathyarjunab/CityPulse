# CityPulse

Discover local events, personalize your feed, set reminders, and design custom event cards with CityPulse, a full-stack Next.js application.

## Admin login

| Email | Password |
| --- | --- |
| `Test@gmail.com` | `Test@123` |

Log in at `/login` and you'll land on the admin dashboard (`/admin`). Visitors can create their own account at `/signup`.

## Run it with Docker (recommended)

You only need [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose). No Node.js or database install is required.

```bash
docker compose up --build
```

Then open **http://localhost:3000**.

This starts two containers:

- **db**: PostgreSQL 17 with a persistent volume.
- **app**: the CityPulse production build. On every start it applies the database migrations, creates the admin account above, and loads the 15 sample events if the database is empty.

The first build takes a few minutes. After that, `docker compose up` starts in seconds.

| Task | Command |
| --- | --- |
| Stop | `docker compose down` |
| Stop and wipe all data (fresh sample data on next start) | `docker compose down -v` |
| Rebuild after code changes | `docker compose up --build` |

> The Docker setup uses local review values for `JWT_SECRET` and the admin password (see `docker-compose.yml`). Change them for any real deployment.

## Run it locally without Docker

Requirements: Node.js 20.19+ (24 recommended) and a PostgreSQL database (local, or hosted such as Neon).

1. Create a `.env` file in the project root:

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
   JWT_SECRET="a-long-random-string"
   ADMIN_EMAIL="Test@gmail.com"
   ADMIN_PASSWORD="Test@123"
   ```

2. Install, set up the database and start the dev server:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run db:seed
   npm run dev
   ```

3. Open http://localhost:3000.

`npm run db:seed` recreates the sample events every time it runs, which also removes reminders and card designs. For a production build, use `npm run build` and then `npm start`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign login tokens (HS256) |
| `ADMIN_EMAIL` | For seeding | Email of the admin account created by the seed |
| `ADMIN_PASSWORD` | For seeding | Password of the admin account created by the seed |

## What's inside

**Admin**

- One admin account (seeded). Admin pages and admin APIs are protected on the server.
- Add an event: title, category (Music, Workshop, Food, Sports, Kids), city, date and time, price, description and image URL.
- Edit an event, and switch it between Active and Inactive. Events are never deleted.

**Visitors**

- Events page with only active, upcoming events, nearest date first.
- Category, city and text filters that work together, plus pagination. Filters live in the URL, so they survive a refresh.
- Signup and login with email and password; login returns a JWT.
- After first login, visitors pick favourite categories. **My feed** then shows only upcoming events from those categories.
- **Remind me** on every event: it flips on screen immediately (React `useOptimistic`), is saved to the database, and rolls back with a message if saving fails.

**Event card designer** (on each event page)

- 3 background themes and 5 stickers. Add up to 3 stickers (repeats allowed) and remove them.
- The card updates live with animations and is saved per user per event, so it's still there after a refresh.

**Throughout**

- Every page talks to the JSON API below, so a mobile app can reuse it.
- Loading, empty and error states everywhere.
- Prices in Indian format (₹1,50,000) and dates like "Sat, 18 Oct, 6:30 PM" in IST.
- Responsive on phone and laptop.

## Sample data

The seed creates 15 events across all 5 categories and 5 cities (Coimbatore, Chennai, Bengaluru, Mumbai, Hyderabad):

- 10 active and upcoming
- 2 inactive and upcoming
- 3 in the past, one of them inactive

Dates are relative to when the seed runs, so "upcoming" events stay upcoming. Prices range from free to ₹1,50,000. Try the filters with **Music + Coimbatore + "night"**.

## Design notes

### Database structure

```mermaid
erDiagram
    USER ||--o{ REMINDER : sets
    USER ||--o{ CARD_DESIGN : designs
    EVENT ||--o{ REMINDER : has
    EVENT ||--o{ CARD_DESIGN : has

    USER {
        string id PK
        string email UK "stored lower-cased"
        string passwordHash "bcrypt"
        enum role "USER | ADMIN"
        enum[] favoriteCategories
    }
    EVENT {
        string id PK
        string title
        enum category "MUSIC | WORKSHOP | FOOD | SPORTS | KIDS"
        string city
        timestamptz startsAt
        int price "whole rupees, 0 = free"
        string description
        string imageUrl
        boolean isActive
    }
    REMINDER {
        string userId PK, FK
        string eventId PK, FK
        timestamptz createdAt
    }
    CARD_DESIGN {
        string userId PK, FK
        string eventId PK, FK
        enum theme "SUNSET | OCEAN | MIDNIGHT"
        enum[] stickers "max 3, order kept, repeats allowed"
    }
```

Why it's designed this way:

- **Enums for fixed lists.** Category, role, theme and sticker are Postgres enums, so the database itself rejects bad values.
- **Favourites as an enum array on `User`.** There are only 5 categories, so an array is simpler than a join table. The feed is just `category IN user.favoriteCategories`.
- **Composite primary keys `(userId, eventId)`** on `Reminder` and `CardDesign`. A user can have only one reminder and one card per event, so "Remind me" and saving a card are idempotent upserts.
- **Events are never deleted.** The `isActive` flag hides them instead, as the brief requires. Deleting a user cascades to their reminders and cards.
- **`price` is whole rupees as an `Int`,** so there's no floating-point error. **`startsAt` is a `timestamptz`,** stored in UTC and shown in IST.

### How the filter query works

`GET /api/events` builds a single Prisma `where` clause, so all filters combine with AND:

```ts
{
  isActive: true,
  startsAt: { gte: now },                                   // upcoming only
  category,                                                 // optional, exact enum match
  city: { equals: city, mode: "insensitive" },              // optional
  OR: [                                                     // optional text search
    { title:       { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ],
}
// orderBy: [{ startsAt: "asc" }, { id: "asc" }]   skip/take for pagination, plus a count for totalPages
```

The count and the page are fetched in one transaction.

**Indexes.** These already exist:

- `(isActive, startsAt)` covers the base filter and the sort.
- `category` and `city` cover those filters.

At scale I would add:

1. **`(isActive, category, startsAt)`**, so a category filter, the date range and the sort are all served by one index.
2. **A `pg_trgm` GIN index on `title` and `description`,** because `ILIKE '%night%'` can't use a normal B-tree index.
3. **An index on `lower(city)`,** or keep comparing exact values, since cities are already saved title-cased ("coimbatore" becomes "Coimbatore").

### Passwords and admin protection

- **Passwords** are hashed with **bcrypt** (`bcryptjs`, cost 10) and only the hash is stored. Login gives the same "Wrong email or password" message whether the email or the password is wrong.
- **Sessions** use a **JWT** (HS256, signed with `JWT_SECRET`, valid 7 days) that carries the user id and role. The token is returned in the response for `Authorization: Bearer` clients, and also set as an **httpOnly, SameSite=Lax** cookie, which is `Secure` over HTTPS, for the web app.
- **Roles** are fixed at the source: signup always creates a `USER`, and the single `ADMIN` exists only through the seed.
- **Admin pages and APIs** are checked on the server at three layers:
  1. `proxy.ts` redirects logged-out visitors to login and non-admins to `/events` before the page renders.
  2. The admin layout runs `requireAdminSession()` on the server again before showing any admin page.
  3. Every `/api/admin/*` handler calls `requireAdmin()`, which verifies the JWT signature, expiry and role, and returns `401` or `403` otherwise. So the API is safe even if it's called directly.

## API reference

All endpoints return JSON.

**Authentication.** Login and signup return a JWT (valid 7 days). Send it as `Authorization: Bearer <token>`, which is the way for mobile and other API clients. The web app also receives the same token in an httpOnly cookie (`cp_token`), so the server can protect pages. Every protected endpoint accepts either.

**Errors** always use this shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields.", "fields": { "email": "Enter a valid email address." } } }
```

Common status codes: `400` invalid input, `401` not logged in, `403` not an admin, `404` not found, `409` email already registered.

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Public | Body `{ email, password }` (password 8–72 characters). Returns `201 { token, user }`. |
| `POST` | `/api/auth/login` | Public | Body `{ email, password }`. Returns `{ token, user }`, or `401` for wrong credentials. |
| `GET` | `/api/auth/me` | User | The current user: `{ user: { id, email, role, favoriteCategories } }` |
| `POST` | `/api/auth/logout` | Public | Clears the login cookie. Returns `204`. |

### Events (visitors)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/events` | Public* | Active, upcoming events, nearest first. Query: `category` (`MUSIC`, `WORKSHOP`, `FOOD`, `SPORTS`, `KIDS`), `city`, `q` (searches title and description), `page` (default 1), `pageSize` (default 9, max 24). Returns `{ events, page, pageSize, total, totalPages, authenticated }`. |
| `GET` | `/api/events/cities` | Public | Cities that have upcoming events: `{ cities }` |
| `GET` | `/api/events/:id` | Public* | One active event: `{ event, authenticated }` |
| `PUT` | `/api/events/:id/reminder` | User | Set a reminder. Safe to repeat. Returns `{ reminded: true }`. |
| `DELETE` | `/api/events/:id/reminder` | User | Remove a reminder. Returns `{ reminded: false }`. |
| `GET` | `/api/events/:id/card` | User | Your card design for this event: `{ design: { theme, stickers }, saved }`. Returns the default design if you haven't made one. |
| `PUT` | `/api/events/:id/card` | User | Save a card design. Body `{ theme: "SUNSET" \| "OCEAN" \| "MIDNIGHT", stickers: ("PARTY" \| "MUSIC" \| "HEART" \| "STAR" \| "FIRE")[] }`, with up to 3 stickers. |
| `GET` | `/api/feed` | User | Upcoming events from your favourite categories. Query: `page`, `pageSize`. Also returns `favoriteCategories`. |
| `GET` | `/api/me/favorites` | User | `{ favoriteCategories }` |
| `PUT` | `/api/me/favorites` | User | Body `{ categories: Category[] }` (at least one). Replaces your favourites. |

\* Public, but when a token is sent each event also includes `remindedByMe`.

Each event in these responses has the shape `{ id, title, category, city, startsAt (ISO 8601), price (whole rupees, 0 = free), description, imageUrl, remindedByMe }`.

### Admin

All admin endpoints require an admin token (`401` if you're not logged in, `403` if you're logged in as a visitor).

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/events` | All events, active or not: upcoming first, then past. Returns `{ events }`. |
| `POST` | `/api/admin/events` | Create an event. Body `{ title, category, city, startsAt, price, description, imageUrl, isActive? }`. `startsAt` is an ISO date in the future; `price` is whole rupees ≥ 0. Returns `201 { event }`. |
| `GET` | `/api/admin/events/:id` | One event: `{ event }` |
| `PATCH` | `/api/admin/events/:id` | Update any subset of the fields above, e.g. `{ "isActive": false }` to deactivate. A changed date must be in the future. There is no delete. |

### Example: log in and fetch your feed

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"Test@gmail.com","password":"Test@123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

curl -s "http://localhost:3000/api/events?category=MUSIC&city=Coimbatore&q=night" -H "Authorization: Bearer $TOKEN"
```

## Tech stack

- **Next.js 16** (App Router), React 19 and TypeScript
- **PostgreSQL** with **Prisma 7** and the `pg` driver adapter
- **Tailwind CSS v4**, Lucide icons, Bricolage Grotesque and DM Sans (Google Fonts), and Sonner toasts
- **jose** (JWT), **bcryptjs** (password hashing) and **zod** (validation shared by the browser and the API)

## Project structure

```text
app/
  (auth)/         login and signup pages
  (site)/         events, event page, feed, favourites, admin pages
  api/            JSON API route handlers
components/       UI components (admin, events, auth, ui primitives)
lib/              auth (JWT, sessions), validation, formatting, queries
prisma/           schema, migrations and seed
proxy.ts          route protection (Next.js 16 "proxy", formerly middleware)
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a migration (development) |
| `npm run db:seed` | Seed the admin account and sample events |
| `npm run db:studio` | Open Prisma Studio |
