# Hostel Helper

Hostel Helper is a Node.js and MongoDB web application for managing hostel complaints, anonymous feedback, announcements, polls, and admin dashboard activity. It includes separate student and admin portals served as static frontend pages, with an Express API handling authentication, data, media uploads, and role-based access.

## Features

- Student and admin login with httpOnly cookie-backed server sessions
- Role-scoped sessions for student and admin portals
- Student complaint submission with image/video attachments
- Complaint history and status tracking for students
- Anonymous feedback submission for sensitive hostel issues
- Admin complaint and feedback review workflows
- Admin announcements for hostel updates
- Poll creation, active poll display, and one-vote-per-student tracking
- Admin dashboard stats with complaint counts, resolution rate, category breakdown, and recent activity
- Rate limiting for login, complaint submission, and anonymous feedback submission
- MongoDB-backed media storage for complaint and feedback attachments

## Tech Stack

- Node.js 20
- Express.js
- MongoDB with Mongoose
- express-session with connect-mongo for authentication
- bcryptjs for password hashing
- Vanilla HTML, CSS, and JavaScript frontend

## Project Structure

```text
Hostel-helper-project/
|-- public/
|   |-- admin/          # Admin pages, styles, and scripts
|   |-- student/        # Student pages, styles, and scripts
|   |-- login/          # Login page
|   |-- assets/         # Logos, icons, and shared assets
|   `-- js/api.js       # Shared frontend API/session helper
|-- src/
|   |-- config/         # Environment validation and MongoDB connection
|   |-- middleware/     # Auth and rate limiting middleware
|   |-- models/         # Mongoose models
|   |-- routes/         # API route handlers
|   |-- utils/media.js  # Attachment validation and media helpers
|   `-- seed.js         # Development seed data script
|-- server.js           # Express app entry point
|-- package.json
`-- README.md
```

## Prerequisites

- Node.js 20.x
- npm
- MongoDB database, either local or hosted

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root from the safe example:

```bash
cp .env.example .env
```

Then set `MONGO_URI` and replace `SESSION_SECRET` with a high-entropy value.

3. Seed development data:

```bash
npm run seed
```

Warning: the seed script clears existing users, students, admins, complaints, feedback, announcements, polls, poll responses, and uploaded media before inserting sample data.

4. Start the app:

```bash
npm run dev
```

For production-style startup:

```bash
npm start
```

Open the app at:

```text
http://localhost:3000
```

The root route redirects to `/login`.

## Demo Accounts

After running `npm run seed`, the script prints the demo usernames and one-time generated passwords. You can also set `SEED_ADMIN_PASSWORD` and `SEED_STUDENT_PASSWORD` in `.env` if you need deterministic local credentials.

## Main Pages

- `/login` - student/admin login
- `/student/home` - student dashboard
- `/student/complaint` - submit complaint
- `/student/complaint-history` - view complaint history
- `/student/anonymous` - submit anonymous feedback
- `/admin/dashboard` - admin overview dashboard
- `/admin/complaints` - manage complaints
- `/admin/anonymous` - manage anonymous feedback
- `/admin/announcements` - manage announcements and polls

## API Overview

Authentication:

- `POST /api/auth/login` - login as student or admin
- `POST /api/auth/logout` - clear the server session cookie

Users:

- `GET /api/users/me` - get current profile
- `PUT /api/users/me` - update editable student profile fields

Complaints:

- `POST /api/complaints` - student submits a complaint
- `GET /api/complaints/my` - student views own complaints
- `GET /api/complaints` - admin views all complaints
- `PUT /api/complaints/:id` - admin updates complaint status or remarks

Anonymous Feedback:

- `POST /api/feedback` - student submits anonymous feedback
- `GET /api/feedback` - admin views anonymous feedback
- `PUT /api/feedback/:id` - admin updates feedback status or remarks

Announcements:

- `GET /api/announcements` - authenticated users view active announcements
- `POST /api/announcements` - admin creates announcement
- `DELETE /api/announcements/:id` - admin deletes announcement

Polls:

- `GET /api/polls/active` - authenticated users view active polls
- `GET /api/polls` - admin views all polls
- `POST /api/polls` - admin creates poll
- `PUT /api/polls/:id` - admin updates poll active state or expiry
- `POST /api/polls/:id/vote` - student votes on a poll

Dashboard and Media:

- `GET /api/dashboard` - admin dashboard statistics
- `GET /api/media/:id/content` - stream stored uploaded media
- `GET /api/public-config` - public footer contact configuration

## Attachments

Complaints and anonymous feedback support media attachments with these limits:

- Maximum 3 attachments per submission
- Images and videos only
- Maximum 10 MB per file
- Attachments are submitted as base64 data URLs and stored in MongoDB

## Security Notes

- Passwords are hashed with bcrypt before storage.
- Required environment variables are validated at startup with clear errors.
- API routes use httpOnly cookie-backed server sessions.
- Student-only and admin-only middleware protect role-specific actions.
- Uploaded media requires authentication and is limited to the owning student or admins.
- CORS is restricted by `CORS_ORIGINS`; production defaults to same-origin only.
- Login, complaint submission, and anonymous feedback endpoints are rate limited.
- `.env` is ignored by Git and should never be committed.

## Available Scripts

```bash
npm start      # Run server.js with Node
npm run dev    # Run server.js with nodemon
npm run seed   # Reset and seed development data
```
