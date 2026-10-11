# CityPulse: Community Events Board

An admin posts local events; visitors browse, filter, set reminders, build a feed from favourite categories and design a card for each event. Built with Next.js 16 (App Router), PostgreSQL and Prisma.

## Setup

**With Docker (recommended, only Docker needed):**

```bash
docker compose up --build
```

Open http://localhost:3000. The database, migrations, admin account and 15 sample events are set up automatically. Stop with `docker compose down`, or use `docker compose down -v` to also wipe the data.

**Without Docker (Node.js 20.19+ and a PostgreSQL database):**

1. Create `.env`:

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
   JWT_SECRET="any-long-random-string"
   ADMIN_EMAIL="Test@gmail.com"
   ADMIN_PASSWORD="Test@123"
   ```

2. Run:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run db:seed
   npm run dev
   ```

## Admin login

| Email | Password |
| --- | --- |
| `Test@gmail.com` | `Test@123` |

## API

The login and signup endpoints return a JWT. Send it as `Authorization: Bearer <token>`; the web app gets the same token in an httpOnly cookie. Errors look like `{ "error": { "code", "message", "fields?" } }`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Create an account and get a JWT |
| POST | `/api/auth/login` | Public | Log in and get a JWT |
| GET | `/api/auth/me` | User | Current user |
| POST | `/api/auth/logout` | Public | Clear the login cookie |
| GET | `/api/events` | Public | Active upcoming events. Query: `category`, `city`, `q`, `page`, `pageSize` |
| GET | `/api/events/cities` | Public | Cities for the city filter |
| GET | `/api/events/:id` | Public | One event |
| PUT / DELETE | `/api/events/:id/reminder` | User | Set or remove a reminder |
| GET / PUT | `/api/events/:id/card` | User | Get or save the card design (theme and up to 3 stickers) |
| GET / PUT | `/api/me/favorites` | User | Get or replace favourite categories |
| GET | `/api/feed` | User | Upcoming events from favourite categories |
| GET / POST | `/api/admin/events` | Admin | List all events, or create one |
| GET / PATCH | `/api/admin/events/:id` | Admin | Get an event, or update it (including Active/Inactive). There is no delete. |

## What's left

- **Remind me:** tapping it again while a save is still in progress is ignored, so very fast repeated taps can leave it on. A single tap, refresh persistence and rollback on failure all work as required.

## Questions

### Database structure, and why

```mermaid
erDiagram
    USER ||--o{ REMINDER : sets
    USER ||--o{ CARD_DESIGN : designs
    EVENT ||--o{ REMINDER : has
    EVENT ||--o{ CARD_DESIGN : has
    USER {
        string id PK
        string email UK
        string passwordHash
        enum role
        enum[] favoriteCategories
    }
    EVENT {
        string id PK
        string title
        enum category
        string city
        timestamptz startsAt
        int price
        string description
        string imageUrl
        boolean isActive
    }
    REMINDER {
        string userId PK
        string eventId PK
    }
    CARD_DESIGN {
        string userId PK
        string eventId PK
        enum theme
        enum[] stickers
    }
```

Four tables. Category, role, theme and sticker are Postgres enums, so the database rejects invalid values. Favourites are an enum array on `User`, simpler than a join table for 5 fixed categories. `Reminder` and `CardDesign` use a composite key `(userId, eventId)`, so each user has at most one of each per event. Events are deactivated with `isActive`, never deleted. Prices are whole rupees as `Int`, and times are `timestamptz`.

### How the filter query works, and which index I'd add

`GET /api/events` builds one Prisma `where` clause: `isActive = true AND startsAt >= now`, plus `category`, a case-insensitive `city` and an optional `q` matched against title OR description. Everything is ANDed together, sorted by `startsAt` ascending and paginated with `skip`/`take` alongside a `count`. Indexes already exist on `(isActive, startsAt)`, `category` and `city`. I'd add a composite `(isActive, category, startsAt)` for filtered and sorted pages, and a `pg_trgm` GIN index on title and description for the text search.

### Passwords, and protecting the admin pages and APIs

Passwords are hashed with bcrypt (cost 10), and only the hash is stored. Login returns an HS256 JWT (7 days) carrying the user id and role. Signup always creates a `USER`; the single `ADMIN` comes from the seed. Admin pages are checked on the server by `proxy.ts` and again in the admin layout, and every `/api/admin/*` handler verifies the JWT and role, returning `401` or `403`.

## AI tools

I used Claude Code (an AI coding assistant) while building this project: for planning the schema and features, writing and refactoring the components and API routes, debugging, and checking flows in the browser. I reviewed the code it produced and made my own changes on top.
