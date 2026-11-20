# Task Manager with Node.js, Express and MongoDB

This project is a simple task management application built with Node.js, Express.js, MongoDB and Handlebars. It keeps the original UI and adds a cleaner backend, validation, error handling, and a REST API suitable for testing in a university project.

## Current features

- Create task
- List tasks
- Edit task
- Delete task
- Toggle task done/undone
- MongoDB persistence
- REST API for tasks
- Basic validation and error handling

## What was fixed

- Empty or invalid task titles are rejected
- Invalid MongoDB IDs are handled safely
- Missing tasks return 404
- Invalid input returns 400
- MongoDB configuration uses environment variables
- Docker setup keeps MongoDB in a dedicated container
- Express routes and controllers were cleaned up without changing the app architecture

## Project structure

- `src/app.js` – Express app initialization and global error handling
- `src/routes/tasks.routes.js` – UI routes and API routes
- `src/controllers/tasks.controllers.js` – CRUD, validation, and REST logic
- `src/model/Task.js` – Mongoose schema
- `src/config.js` – environment configuration
- `src/views/` – Handlebars templates for the web UI

## Environment variables

Copy `.env.example` to `.env` and adjust values if needed. In PowerShell:

```bash
Copy-Item .env.example .env
```

The local defaults point to MongoDB on port `27018`, matching the port published by
Docker Compose. When the app runs inside Compose, it connects to the MongoDB
service on its internal port `27017`.

## Start MongoDB with Docker

From the project root:

```bash
docker compose up -d mongo
```

or, for older Docker Compose versions:

```bash
docker-compose up -d mongo
```

This starts MongoDB on `localhost:27018` and keeps the database in a Docker volume.

## Run the app

### Local development

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

### With Docker Compose

```bash
docker compose up --build
```

The stack starts both the Node.js app and MongoDB.

## REST API

```http
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
PATCH  /api/tasks/:id/status
DELETE /api/tasks/:id
```

### Example payload

```json
{
  "title": "Finish software testing lab",
  "description": "Prepare the test plan and run the validation steps."
}
```

### Status codes

- `200` OK
- `201` Created
- `400` Bad Request
- `404` Not Found
- `500` Server Error

## Testing

Start MongoDB before running the integration tests:

```bash
docker compose up -d mongo
npm test
```

Tests use a separate `tasksdb_test` database by default. Set
`TEST_MONGODB_URI` to use a different test-only database; tests do not drop the
application's `tasksdb` database.

The test suite checks API, authentication, task ownership, and admin behavior.
For example:

- GET `/api/tasks`
- POST validation for empty titles
- 404 for missing tasks
- successful task update

## Notes

- Basic user authentication and admin routes are included.
- The existing UI remains in place; the code was improved progressively rather than rewritten.
- MongoDB stays in Docker and uses environment variables instead of hardcoded secrets.

## Remaining improvements

- Add a real login system if the project evolves into a multi-user application
- Add a more complete validation library later if needed
- Expand automated tests for edge cases and failure scenarios
- Consider deployment and production Docker improvements in a later phase
