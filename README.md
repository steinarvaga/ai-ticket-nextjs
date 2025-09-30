# 🎫 AI Ticket Management System

A full-stack **Next.js 15 (App Router)** intelligent ticket management system that uses AI to automatically analyze, prioritize, and assign support tickets to moderators based on their skills and expertise.
This project was migrated from an existing full-stack React/Vite + Express codebase, [the-sukhsingh/aiticket](https://github.com/the-sukhsingh/aiticket), to a **Next.js 15** app/project with **Inngest** for background processing.

## 🧩 Features

### 🔮 AI-Powered Intelligence

- **Automatic Ticket Analysis**: Uses Google Gemini AI to analyze ticket content and generate summaries
- **Priority Detection**: Automatically determines ticket priority (low, medium, high) based on issue description
- **Skill Identification**: Identifies required skills needed to resolve the ticket
- **Smart Assignment**: Auto-assigns tickets to moderators based on skill matching
- **Helpful AI Notes**: Provides technical solutions and troubleshooting resources

### 🎭 Role-Based Access Control

- **Users**: Can create and view their own tickets
- **Moderators**: Can view and manage all tickets, reply with solutions, update ticket status
- **Admins**: Full system access including user management and ticket oversight

### 🔔 Automated Notifications

- Welcome emails are sent upon user registration
- Assignment notifications are sent to moderators when tickets are assigned
- Real-time status updates and replies are included

### ⏳ Background Processing

- Powered by **Inngest** for reliable background job processing
- Asynchronous AI analysis and email notifications
- Scalable event-driven architecture

## 🧰 Tech Stack

### 🛠️ Backend

- **Next.js 15, App Router** — REST API via app/api route handlers
- **MongoDB** with **Mongoose** - Database and ODM
- **Google Gemini AI** via **@inngest/agent-kit** - AI ticket analysis
- **Inngest** - Background job processing and workflow management
- **JWT** - Authentication and authorization
- **bcrypt** - Password hashing and security
- **Nodemailer** with **Mailtrap** - Email service

### 🎨 Frontend

- **Next.js 15 (App Router)** — full-stack React framework (uses React 19) with file-based routing.
- **App Router (`app/` directory)** — built-in routing with nested layouts & route groups;
- **Tailwind CSS + daisyUI** — utility-first styling and prebuilt UI components.
- **React Hook Form** — form handling and validation (optionally with Zod).
- **React Context API** — lightweight client-side state for Client Components.

## ✅ Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Google Gemini API Key** (for AI features)
- **Mailtrap Account** (for email notifications)

## 🏁 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-ticket-nextjs
```

### 2. Setup

```bash
cd ai-ticket-nextjs
npm install
```

Create a `.env.local` file in the `ai-ticket-nextjs` directory:

```env.local
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000

# Email Configuration (Mailtrap)
MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=2525
MAILTRAP_SMTP_USER=your_mailtrap_user
MAILTRAP_SMTP_PASSWORD=your_mailtrap_password

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

APP_URL=http://localhost:3000
```

### 3. Start the Application

**Terminal 1 - Next.js Dev Server:**

```bash
cd ai-ticket-nextjs
npm run dev
```

**Terminal 2 - Inngest Dev Server (for background jobs):**

```bash
cd ai-ticket-nextjs
npm run inngest-dev
```

The application will be available at:

- **Next.js App Router**: http://localhost:3000
- **Inngest UI**: http://localhost:8288

## 📚 API Documentation

### Authentication Routes (`/api/users/*`)

#### POST `/api/users/register/route.ts`

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "user",
  "skills": ["React", "Node.js"]
}
```

#### POST `/api/users/login/route.ts`

Login with email and password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword",
  "remember": "on"
}
```

### Ticket Routes (`/api/tickets/*`)

#### GET `/api/tickets/route.ts` 🔒

Retrieve tickets based on user role:

- **Users**: Only their own tickets
- **Moderators/Admins**: All tickets

#### GET `/api/tickets/[id]/route.ts` 🔒

Get a specific ticket by ID.

#### POST `/api/tickets/route.ts` 🔒

Create a new ticket.

**Request Body:**

```json
{
  "title": "Login Issue",
  "description": "Cannot access user dashboard after login",
  "deadline": "2025-06-20T10:00:00.000Z",
  "priority": "low",
  "assignedTo": "user_id",
  "relatedSkills": ["Node.js", "Authentication", "Express"]
}
```

#### PUT `/api/tickets/[id]/route.ts` 🔒

Update ticket information.

**Request Body:**

```json
{
  "_id": "ticket_id",
  "title": "Login Issue",
  "description": "Cannot access user dashboard after login",
  "status": "IN_PROGRESS",
  "priority": "low",
  "createdBy": "user_id",
  "assignedTo": "user_id",
  "helpfulNotes": "Updated troubleshooting steps...",
  "createdAt": "2025-06-20T10:00:00.000Z",
  "deadline": "2025-06-20T10:00:00.000Z",
  "relatedSkills": ["Node.js", "Authentication", "Express"]
}
```

#### POST `/api/tickets/reply/route.ts` 🔒

Add a moderator reply to a ticket.

**Request Body:**

```json
{
  "ticketId": "ticket_id",
  "code": "Optional code solution",
  "explanation": "Detailed explanation of the solution"
}
```

### User Management (`app/admin/page.tsx`)

Admin-only for user management.

## 📜 License

This project is licensed under the [ISC License](LICENSE.md).

## 🧭 Project Structure

```
ai-ticket-nextjs/
├── app/                        # Next.js App Router directory for pages & API routes
│   ├── globals.css             – Global CSS (import Tailwind base and DaisyUI styles here)
│   ├── layout.tsx              – Global layout (Server Component; wraps pages with providers like AuthProvider)
│   ├── page.tsx                – Landing page (Server Component)
│   ├── login/
│   │   └── page.tsx            – Login page (Client Component; contains login form)
│   ├── signup/
│   │   └── page.tsx            – Signup page (Client Component)
│   ├── ticket/
│   │   └── page.tsx
│   ├── profile/
│   │   ├── _components/
│   │   │     ├── Alerts.tsx
│   │   │     ├── EditMode.tsx
│   │   │     ├── PasswordFields.tsx
│   │   │     ├── ProfileDetailsCard.tsx
│   │   │     ├── ProfileSummaryCard.tsx
│   │   │     ├── SkillsEditor.tsx
│   │   │     ├── types.ts
│   │   │     ├── utils.ts
│   │   │     └── ViewMode.tsx
│   │   └── page.tsx            – Profile page (Client Component; protected)
│   ├── dashboard/
│   │   └── page.tsx            – Homepage/Dashboard (Client Component; protected)
│   ├── admin/
│   │   └── page.tsx            – Admin dashboard page (Client Component; protected)
│   ├── assigned/
│   │   └── page.tsx            – Assigned tickets page (Client Component; protected)
│   └── api/                    # Next.js API route handlers (replacing Express routes)
│       ├── users/
│       │   ├── login/
│       │   │   └── route.ts   – POST /api/users/login (Server Route: handle user login, JWT issuance)
│       │   ├── signup/
│       │   │   └── route.ts   – POST /api/users/signup (Server Route: handle new user registration)
│       │   └── [id]/
│       │       └── route.ts   – GET/PUT /api/users/[id] (Server Route: e.g. user profile fetch or update)
│       ├── tickets/
│       │   ├── route.ts       – GET/POST /api/tickets (Server Route: list tickets or create new ticket)
│       │   ├── reply/
│       │   │    └── route.ts  – POST /api/tickets/reply (Server Route: Ticket.findByIdAndUpdate)
│       │   └── [id]/
│       │        └── route.ts   – GET/PUT /api/tickets/[id] (Server Route: fetch or update specific ticket)
│       ├── logout/
│       │    └── route.ts
│       ├── profile/
│       │    └── route.ts
│       └── inngest/
│            └── route.ts       – **Inngest** serve handler (Server Route: allows Inngest to invoke background functions)
├── components/                 # Reusable UI components
│   ├── common/
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorAlert.tsx
│   │   └── Loader.tsx
│   ├── dashboard/
│   │   ├── HeaderBar.tsx
│   │   ├── StatsBar.tsx
│   │   ├── TicketCard.tsx
│   │   ├── TicketForm.tsx
│   │   ├── TicketList.tsx
│   │   ├── TicketsSection.tsx
│   │   └── UserInfoCard.tsx
│   └── Navbar.tsx              – Navigation bar (Client Component; uses Next.js Link for routing)
├── context/                    # React Context providers for global state
│   ├── AuthContext.tsx         – Authentication context provider (Client Component; provides current user/JWT info)
│   └── TicketContext.tsx       – Ticket context provider (Client Component; provides ticket data/state)
├── inngest/                    # Inngest client and background function definitions
│   ├── client.ts               – Inngest client initialization (Server Module; similar to original inngest/client.js)
│   └── functions/
│       ├── on-signup.ts        – Inngest function (Server Module; triggered on user signup event)
│       └── on-ticket-create.ts – Inngest function (Server Module; triggered on ticket creation event)
├── lib/                        # Utility libraries and server-only modules
│   ├── env.ts                  - getEnvVariable
│   ├── types.ts
│   └── server/
│       ├── auth.ts            – Auth utilities (Server Module; e.g. JWT verify function, replaces Express auth middleware)
│       └── jwt.ts             - signJWT, verifyJWT
├── models/                     # MongoDB schemas
│   ├── ticket.ts              – Mongoose Ticket model (Server Module; migrated from Express models/ticket.js)
│   └── user.ts                – Mongoose User model (Server Module; migrated from Express models/user.js)
├── utils/                      # Utility functions
│   ├── ai.ts                  – AI helper functions (Server Module; migrated from utils/ai.js)
│   ├── date.ts
│   ├── db.ts                  – Database connection setup (Server Module; handles Mongoose connection pooling)
│   └── mailer.ts              – Email utility (Server Module; migrated from utils/mailer.js, uses nodemailer)
├── public/                     # Public assets (if any; similar to Vite public/)
├── middleware.ts              – Next.js Middleware (Edge Function; global JWT auth check & route protection logic)
├── next-env.d.ts
├── tailwind.config.js         – Tailwind CSS configuration (with DaisyUI plugin)
├── next.config.ts             – Next.js configuration (e.g. API route config, experimental flags)
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── .env.local                 – Environment variables (includes JWT secret, DB URI, etc. for Next app)

```
