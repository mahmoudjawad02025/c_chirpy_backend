# Chirpy

A small HTTP API for short posts, written in TypeScript.

I built this repository as my own implementation of the Chirpy assignment from the [Boot.dev](https://www.boot.dev) backend course. The product idea, the 140-character limit, the three filtered words, Chirpy Red, and the Polka webhook come from that course. The code here is mine.

- It stores users and short posts called chirps.
- A request goes from a route in `src/index.ts`, to a handler, to a query, to the Drizzle schema.
- Run it with Node.js, a PostgreSQL database, and `npm run dev`. The sample env uses port `8080`.
- This is a learning backend. It is not a deployed product, and it has no users.

<br>

<a id="contents"></a>

## 📋 Contents

- [What this is](#what-this-is)
- [Stack](#stack)
- [What you can do](#what-you-can-do)
- [Routes](#routes)
  - [Users](#users)
  - [Session](#session)
  - [Chirps](#chirps)
  - [Webhook](#webhook)
  - [Admin](#admin)
- [Auth](#auth)
- [Data](#data)
- [Run it](#run-it)
- [Layout](#layout)
- [Tests](#tests)
- [Docs](#docs)
- [Contact](#contact)

<br>

<a id="what-this-is"></a>

## 🔎 What this is

Chirpy stores users and short posts called chirps.

A user can register, log in, change their own email and password, and delete their own chirps. Anyone can list chirps or read one by id. A webhook can mark a user as Chirpy Red when it receives a `user.upgraded` event and a matching API key. There is no route that sets Chirpy Red back to false.

<br>

<a id="stack"></a>

## ⚙️ Stack

| Piece | What this repo uses |
| --- | --- |
| Runtime | Node.js `22.14.0` in `.nvmrc`. `package.json` has no `engines` field, so that version is not enforced. |
| Language | TypeScript `^7.0.2`, ESM (`"type": "module"`) |
| HTTP | Express `^5.2.1` |
| Database | PostgreSQL |
| Queries | Drizzle ORM `^0.45.3` and `postgres` `^3.4.9` |
| Passwords | Argon2 `^0.45.1` |
| Access tokens | `jsonwebtoken` `^9.0.3`. The sign call does not set an algorithm. The library default is HS256. The secret comes from `JWT_SECRET`. |
| API pages | Swagger UI at `/api-docs`, Scalar at `/reference` |
| Tests | Vitest `^3.2.7` |
| License field | `ISC` in `package.json`. There is no `LICENSE` file. |

<br>

<a id="what-you-can-do"></a>

## ✨ What you can do

- Create a user. The password is hashed with Argon2 before it is stored. The hash is never returned.
- Log in with email and password. A wrong email and a wrong password return the same `401` message.
- Receive an access token (1 hour) and a refresh token (60 days).
- Exchange a valid refresh token for a new access token.
- Revoke a refresh token.
- Update the logged-in user's email and password.
- Create a chirp of at most 140 characters. The words `kerfuffle`, `sharbert`, and `fornax` are replaced with `****` when they appear as whole words, ignoring case.
- List chirps, oldest first by default, or newest first with `?sort=desc`. Filter with `?authorId=`.
- Read one chirp by id.
- Delete a chirp only if the access token belongs to its author.
- Upgrade a user to Chirpy Red through `POST /api/polka/webhooks`.
- Read a plain `OK` from `GET /api/healthz`.
- See an in-memory visit count for the static page at `GET /admin/metrics`.
- In development only, reset that counter and delete every user with `POST /admin/reset`.

<br>

<a id="routes"></a>

## 📡 Routes

Base URL when you run it locally: `http://localhost:<PORT>`. The sample env uses port `8080`.

`Authorization: Bearer <token>` is required only where the Auth column says so. The handler reads the second word of that header.

| Method | Path | Auth | Success |
| --- | --- | --- | --- |
| `GET` | `/api/healthz` | None | `200` text `OK` |
| `GET` | `/admin/metrics` | None | `200` HTML |
| `POST` | `/admin/reset` | None. Refuses unless `PLATFORM` is `dev` | `200` text, or `403` |
| `POST` | `/api/users` | None | `201` JSON |
| `PUT` | `/api/users` | Access token | `200` JSON |
| `POST` | `/api/login` | None | `200` JSON |
| `POST` | `/api/refresh` | Refresh token | `200` JSON |
| `POST` | `/api/revoke` | Refresh token | `204` empty |
| `POST` | `/api/chirps` | Access token | `201` JSON |
| `GET` | `/api/chirps` | None | `200` JSON array |
| `GET` | `/api/chirps/:chirpId` | None | `200` JSON |
| `DELETE` | `/api/chirps/:chirpId` | Access token | `204` empty |
| `POST` | `/api/polka/webhooks` | `POLKA_UPGRADE_KEY` as the bearer value | `204` empty |
| `GET` | `/app` | None | Static file. `src/app/index.html` is a single heading |
| `GET` | `/api-docs` | None | Swagger UI |
| `GET` | `/reference` | None | Scalar |
| `GET` | `/swagger.json` | None | The generated OpenAPI file |

Error JSON looks like `{ "error": "..." }`. The reset and health handlers return plain text, not JSON. Unhandled errors return `500` with `{ "error": "Internal Server Errors" }`. That string is plural in the code.

`res.json` serializes `Date` values, so timestamp fields in JSON are ISO 8601 strings.

On a route that reads the bearer token, a missing `Authorization` header returns `401` with `"Missing or invalid Authorization header"`. A header with no second word returns `401` with `"Missing token"`. A failed access-token verify returns `401` with `"Invalid token"`.

There is no rate limit and no CORS middleware. The logger prints a `[NON-OK]` line for every status other than `200`, including `201` and `204`.

<br>

<a id="users"></a>

### Users

**Create user** `POST /api/users`

```json
{ "email": "user@example.com", "password": "a-password" }
```

`201` returns `id`, `email`, `createdAt`, `updatedAt`, `isChirpyRed`. A missing or non-string email or password returns `400` with `"Something went wrong"`. A duplicate email is not a `409`. The insert uses `onConflictDoNothing()`, and the handler then reads `user.id`. That throws, and the client receives `500`.

**Update user** `PUT /api/users`

Same body as create. Requires an access token. `200` returns the same user fields. Both email and password are required. There is no route to change only one of them. If the new email is already stored, the database unique constraint fails and the client receives `500`. There is no route to read a user by id.

<br>

<a id="session"></a>

### Session

**Login** `POST /api/login`

Same body as create. `200` returns the user fields plus `token` and `refreshToken`. Unknown email or wrong password returns `401` with `"incorrect email or password"`. If the refresh-token insert returns no row, login returns `500` with `"Failed to create refresh token"`.

**Refresh** `POST /api/refresh`

No body. Send the refresh token as the bearer value. `200` returns `{ "token": "<new access token>" }`. An unknown token returns `401` with `"Invalid refresh token"`. An expired token returns `401` with `"Refresh token expired"`. An already revoked token returns `401` with `"Refresh token revoked"`.

**Revoke** `POST /api/revoke`

No body. Send the refresh token as the bearer value. `204` on success. The same three `401` messages as refresh apply. The row stays in the database with `revoked_at` set.

<br>

<a id="chirps"></a>

### Chirps

`authorId` and `chirpId` are not validated as UUIDs before the query. A malformed id can fail in PostgreSQL and come back as `500`. There is no edit-chirp route.

**Create chirp** `POST /api/chirps`

```json
{ "body": "Hello from Chirpy" }
```

`201` returns the row: `id`, `createdAt`, `updatedAt`, `body`, `userId`.

The length check uses `parsed.body.length`, before `trim()` and before filtering. Over 140 characters returns `400` with `"Chirp is too long. Max length is 140"`. A non-string body returns `400` with `"Something went wrong"`. An empty string is allowed. A bad access token returns `401`.

The filter then runs `trim()`, splits on a single space, and replaces a word only when the whole word is `kerfuffle`, `sharbert`, or `fornax`, ignoring case. `Kerfuffle,` is kept, because of the comma.

**List chirps** `GET /api/chirps`

Optional query: `authorId` (user UUID) and `sort`. `sort=desc` is newest first. Any other value, including a missing `sort`, is oldest first. The list is ordered by `created_at`. Each item has `id`, `createdAt`, `updatedAt`, `body`, `userId`. There is no page size.

**One chirp** `GET /api/chirps/:chirpId`

`200` returns the same chirp fields. `404` with `"Chirp with id <id> not found"` when the id does not match a row.

**Delete chirp** `DELETE /api/chirps/:chirpId`

`403` with `"You can only delete your own chirps"` when the token's user is not the author. `404` when the chirp does not exist. `401` when the access token is missing or invalid.

<br>

<a id="webhook"></a>

### Webhook

**Polka webhook** `POST /api/polka/webhooks`

```json
{
  "event": "user.upgraded",
  "data": { "userId": "<user uuid>" }
}
```

When a bearer value is present and it is not equal to `POLKA_UPGRADE_KEY`, the handler returns `401` with `"Invalid API key"`. Any `event` other than `user.upgraded` returns `204` and changes nothing. `user.upgraded` sets `is_chirpy_red` to `true` for that user and returns `204`. A missing user returns `404` with `"User not found"`. A malformed body returns `400` with `"Invalid request body"`. Nothing in this API sets `is_chirpy_red` back to `false`.

<br>

<a id="admin"></a>

### Admin

**Health** `GET /api/healthz`

`200` with the text `OK`. The handler does not query the database.

**Metrics** `GET /admin/metrics`

HTML that includes the current hit count. The counter increases only for requests under `/app`, and only in this process. It starts at `0` on each boot.

**Reset** `POST /admin/reset`

When `PLATFORM` is not `dev`, the response is `403` and the body is the text `Forbidden: Resetting request count is only allowed in development environment.` That path does not set `text/plain`. When `PLATFORM` is `dev`, the hit counter is set to `0`, every user row is deleted, and the response is `200` with `Content-Type: text/plain` and body `Hits: 0`. Chirps and refresh tokens are removed by the foreign-key cascade.

**Static page** `GET /app`

Serves `src/app/index.html`, a single heading. Requests under `/app` are what increase the metrics counter.

**API pages** `GET /api-docs`, `GET /reference`, `GET /swagger.json`

These open the generated docs. The live paths are the table above. Details are in [Docs](#docs).

<br>

<a id="auth"></a>

## 🔐 Auth

Passwords are hashed with Argon2 (`argon2.hash` / `argon2.verify`). The database stores `hashed_password` only. There is no password length rule.

Access tokens are JWTs signed with `JWT_SECRET`. The payload has `iss: "chirpy"`, `sub` set to the user id, `iat` set to the issue time in seconds, and `exp` set to 3600 seconds after `iat`. The code does not read an expiry from the request. `jwt.sign` is called with the payload and the secret only, so the algorithm is jsonwebtoken's default, HS256. The placeholder in `.env.example` says the secret is base64. The server uses the string as given. It is not base64-decoded. Any non-empty string works, because `jsonwebtoken` uses it as the HMAC secret.

Refresh tokens are 32 random bytes, hex-encoded (64 characters). They are stored in `refresh_tokens` as plaintext, with `expires_at` set to 60 days ahead. Revoke sets `revoked_at`. It does not delete the row. Login creates a new refresh token each time. Older ones stay valid until they expire or are revoked.

`getBearerToken` requires an `Authorization` header and uses the second space-separated word. `Bearer <value>` is the shape the routes expect.

<br>

<a id="data"></a>

## 🗄️ Data

PostgreSQL. Drizzle schema: `src/db/schema.ts`. SQL migrations: `src/db/migrations`. On startup, `src/db/index.ts` runs those migrations, then opens the query pool.

**users**

| Column | Notes |
| --- | --- |
| `id` | UUID primary key, `gen_random_uuid()` |
| `created_at`, `updated_at` | Timestamps, default `now()` |
| `email` | `varchar(256)`, unique, required |
| `hashed_password` | Required. Schema default is the string `unset` if a row is inserted without one. The create-user handler always sends a hash. |
| `is_chirpy_red` | Boolean, default `false`. The webhook can set it to `true`. No route sets it back to `false`. |

**chirps**

| Column | Notes |
| --- | --- |
| `id` | UUID primary key |
| `created_at`, `updated_at` | Timestamps |
| `body` | Required `varchar` with no length in the database. The 140-character limit is only in `src/handlers/chirps.ts`. |
| `user_id` | Required FK to `users.id`, `ON DELETE CASCADE` |

**refresh_tokens**

| Column | Notes |
| --- | --- |
| `token` | Primary key, the raw token string |
| `created_at`, `updated_at` | Timestamps |
| `expires_at` | Required |
| `revoked_at` | Null until revoke |
| `user_id` | Required FK to `users.id`, `ON DELETE CASCADE` |

Email is stored as submitted. `User@Example.com` and `user@example.com` are different rows. The handler does not check that the string contains `@`.

<br>

<a id="run-it"></a>

## 🚀 Run it

You need Node.js `22.14.0` and a PostgreSQL database you can connect to. `.nvmrc` records that Node version. This repo has no Docker file, and `package.json` does not enforce the version.

```bash
npm install
cp .env.example .env
```

`.env.example` has spaces around some values (`PLATFORM =dev`, and a leading space on `JWT_SECRET` and `POLKA_UPGRADE_KEY`). Remove those spaces. The process exits on startup if any of these is missing:

```env
PORT=8080
DB_URL=postgres://USER:PASSWORD@localhost:5432/chirpy
PLATFORM=dev
JWT_SECRET=replace-with-a-long-random-string
POLKA_UPGRADE_KEY=replace-with-another-secret
```

`PLATFORM=dev` is what allows `POST /admin/reset`. Use another value if you do not want that route to delete users.

```bash
npm run dev
```

`npm run dev` compiles with `tsc`, then starts `node dist/index.js`. Migrations run as part of that start. `npm run db:migrate` exists if you want to migrate without starting the server. `npm run db:generate` writes a new migration from the schema.

```bash
npm test
npm run build
npm start
```

`npm start` runs the already built `dist/index.js`. It does not compile.

<br>

<a id="layout"></a>

## 📁 Layout

```text
src/index.ts                 routes
src/config.ts                env loading
src/core/auth.ts             Argon2, JWT, refresh tokens, bearer parsing
src/handlers/                HTTP handlers
src/middlewares/             logging, hit counter, error types
src/db/schema.ts             tables
src/db/index.ts              migrate on boot, then the Drizzle client
src/db/queries/              users, chirps, refresh tokens
src/db/migrations/           SQL migrations
src/app/index.html           the only static page
src/tests/auth.test.ts       the only test file
docs/api_doc.md              generated API notes, not fully accurate
swagger.json                 generated OpenAPI, paths are not the real URLs
swagger.cjs                  swagger-autogen script
drizzle.config.ts
```

<br>

<a id="tests"></a>

## 🧪 Tests

`npm test` runs Vitest once (`vitest --run`).

`src/tests/auth.test.ts` has one assertion: Argon2 verification returns `true` for the password that was hashed. It does not check a wrong password. It does not call HTTP routes, the database, or token code.

<br>

<a id="docs"></a>

## 📖 Docs

The route table in this file is the source of truth.

- API document in this repository: [docs/api_doc.md](docs/api_doc.md)
- After `npm run dev`, with the sample port `8080`:
  - [Swagger UI](http://localhost:8080/api-docs)
  - [Scalar](http://localhost:8080/reference)
  - [swagger.json](http://localhost:8080/swagger.json)

`docs/api_doc.md` and `swagger.json` are generated. They use paths such as `apiPath/...`, `/api/metrics`, and `/api/reset`, and they use port `3000`. The live admin paths are `/admin/metrics` and `/admin/reset`. Authenticated routes in the table above require a token.

<br>

<a id="contact"></a>

## 📞 Contact

📧 Email: mahmoudjawad02025@gmail.com

💻 GitHub Profile: [@mahmoudjawad02025](https://github.com/mahmoudjawad02025)

💼 LinkedIn: [linkedin.com/in/mahmoud-abu-alsebaa](https://www.linkedin.com/in/mahmoud-abu-alsebaa)
