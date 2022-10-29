# `sqlary`

`sqlary` is an API server that exposes endpoints to modify and view salary information.

## Setup

`sqlary` can be run in 2 ways.

### 1. Docker

This method is useful for when you only care about running the API server itself, and do not wish to develop.

If you have Docker installed, simply run this command to bring up the API server on `http://localhost:8080` –

```
docker compose up
```

### 2. Local

This method is useful if you wish to develop `sqlary` locally.

With Node.js (preferably v18.x) installed, you can use these commands. If you'd like to easily switch between multiple versions of Node.js, [`fnm`](https://github.com/Schniz/fnm#readme) is recommended.

To install all dependencies (required) –

```
npm install
```

To run the API server –

```
npm run dev
```

To run all tests –

```
npm run test
```

To generate a test coverage report –

```
npm run coverage
```

To view a human-friendly and interactive test coverage report –

```
npm run coverage:html
```

## APIs

The API documentation is auto-generated and available at [`http://localhost:8080/docs`](http://localhost:8080/docs) (once the server is running). You can also try out all APIs directly from that page.

### Credentials

The `/api-key` API will return an API token in response to user credentials; please pick them up from [`authx/users.ts`](authx/users.ts).

The API key from this API will be used as an `Authorization` Bearer token for all other APIs.

For example, to get a list of all salary records, issue a `GET` request to `http://localhost:8080/salary` with the `Authorization` header set to `Bearer <api-key>`.

## Developer Notes

### Database choice

SQLite has been used as a local file-based backend for the salary data. It is a pretty good choice for small to medium-sized data workloads, and the easiest to operate. As the data volume and the access patterns scale, a more appropriate choice can be used.

The SQLite database is also wired to auto-migrate on boot, so the migration scripts in the [`migrations/`](migrations/) directory are executed in order. This creates the initial tables and records (from the original dataset).

#### Storage format for booleans

SQLite has no primitive `boolean` data type, and so a number type (`0` or `1`) is used; this is enforced with a `CHECK` constrant (see [`migrations/001-init.sql`](migrations/001-init.sql)). The models handle casting this to a more human-friendly `true` or `false`.

### Error handling

For the most part, error handling (including appropriate HTTP status codes) is automatically handled by Fastify and the schema we've set up for each route, so there is no explicit error-handling code. This also makes testing far easier and robust.

### Testing strategy

[`tap`](https://node-tap.org/) has been deliberately chosen over other more popular testing frameworks for a few specific reasons –

1. `tap` does not do "magic" (like how Mocha, Jasmine and Jest often inject globals), so the code is more predictable and without side-effects.
2. `tap` has almost no configuration, and is faster to develop against.
3. Jest, IMO, promotes a few bad testing practices, including `beforeEach` and `afterEach` lifecycle scripts – this is a bad idea, as this subtly encourages developers to share state between tests. It is recommended that tests maintain their own state purely locally.
4. `tap` scripts are also standalone Node.js files – they can just be executed with `node <script-name.js>`, and do not require a CLI.
5. The base output format for `tap`, which is also incidentally called TAP (Test Anything Protocol), has been around 1987 and is a well-known format to describe test output.
6. `tap` is also better suited for testing backend-only services better, and without any browser-API/DOM overhead, is _much_ faster than most testing frameworks.

#### Mocking

Mocking has been kept to a minimum, and used only to mock DB operations. This makes the tests much more portable, without requiring an available DB instance. This also makes testing easier, without worrying about test data.
