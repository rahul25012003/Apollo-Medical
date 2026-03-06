# ICMS - Integrated Conference Management System

## Setup Guide for Development Team

This guide covers the complete setup process for both frontend and backend development.

---

## Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **pnpm**
- **Git**

---

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd icms

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required: Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/icms_db?schema=public"

# Required: NextAuth configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Optional: Email (for OTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@icms.com"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Seed Initial Data (Optional)

```bash
# Create admin user manually via Prisma Studio or API
# Default admin: admin@icms.com / Admin@123
```

### 5. Start Development Server

```bash
npm run dev
```

Access the application at: `http://localhost:3000`

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 19.x | UI library |
| Tailwind CSS | 4.x | Styling (CSS-first) |
| shadcn/ui | latest | UI components |
| react-hook-form | 7.x | Form management |
| Zod | 4.x | Schema validation |
| Zustand | 5.x | State management |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Prisma | latest | ORM & database toolkit |
| PostgreSQL | 14+ | Database |
| NextAuth.js | 5.x (beta) | Authentication |
| bcryptjs | latest | Password hashing |

---

## Project Structure

```
icms/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── events/      # Events CRUD
│   │   │   ├── registrations/
│   │   │   ├── speakers/
│   │   │   ├── sponsors/
│   │   │   ├── certificates/
│   │   │   ├── users/
│   │   │   ├── upload/
│   │   │   └── dashboard/
│   │   ├── auth/            # Auth pages
│   │   ├── dashboard/       # Admin dashboard
│   │   └── events/          # Public event pages
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── layout/          # Layout components
│   ├── lib/
│   │   ├── prisma.ts        # Database client
│   │   ├── auth.ts          # NextAuth config
│   │   ├── auth-utils.ts    # Auth helpers
│   │   ├── api-utils.ts     # API utilities
│   │   ├── upload.ts        # File upload
│   │   ├── utils.ts         # General utilities
│   │   └── validations/     # Zod schemas
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   └── middleware.ts        # Route protection
├── public/
│   └── uploads/             # Local file uploads
├── .env                     # Environment variables
├── .env.example             # Environment template
└── package.json
```

---

## API Documentation

### Authentication

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler | - |
| `/api/auth/register` | POST | User registration | No |
| `/api/auth/otp/send` | POST | Send OTP email | No |
| `/api/auth/otp/verify` | POST | Verify OTP | No |
| `/api/auth/forgot-password` | POST | Request password reset | No |
| `/api/auth/reset-password` | POST | Reset password with token | No |

### Events

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/events` | GET | List events (filtered) | Yes |
| `/api/events` | POST | Create event | EVENT_MANAGER+ |
| `/api/events/public` | GET | Public event listing | No |
| `/api/events/[id]` | GET | Get event details | Yes |
| `/api/events/[id]` | PUT | Update event | EVENT_MANAGER+ |
| `/api/events/[id]` | DELETE | Delete event | EVENT_MANAGER+ |
| `/api/events/[id]/speakers` | GET/POST/PUT/DELETE | Manage speakers | EVENT_MANAGER+ |
| `/api/events/[id]/sponsors` | GET/POST/PUT/DELETE | Manage sponsors | EVENT_MANAGER+ |
| `/api/events/[id]/registrations` | GET | Event registrations | REGISTRATION_MANAGER+ |

### Registrations

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/registrations` | GET | List registrations | REGISTRATION_MANAGER+ |
| `/api/registrations` | POST | Create registration | No (public) |
| `/api/registrations/[id]` | GET | Get registration | Owner or Manager |
| `/api/registrations/[id]` | PUT | Update registration | REGISTRATION_MANAGER+ |
| `/api/registrations/[id]` | DELETE | Delete registration | REGISTRATION_MANAGER+ |
| `/api/registrations/bulk` | POST | Bulk actions | REGISTRATION_MANAGER+ |

### Speakers

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/speakers` | GET | List speakers | Yes |
| `/api/speakers` | POST | Create speaker | EVENT_MANAGER+ |
| `/api/speakers/[id]` | GET/PUT/DELETE | Manage speaker | EVENT_MANAGER+ |

### Sponsors

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/sponsors` | GET | List sponsors | Yes |
| `/api/sponsors` | POST | Create sponsor | EVENT_MANAGER+ |
| `/api/sponsors/[id]` | GET/PUT/DELETE | Manage sponsor | EVENT_MANAGER+ |

### Certificates

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/certificates` | GET | List certificates | CERTIFICATE_MANAGER+ |
| `/api/certificates` | POST | Create certificate(s) | CERTIFICATE_MANAGER+ |
| `/api/certificates/[id]` | GET/PUT/DELETE | Manage certificate | CERTIFICATE_MANAGER+ |
| `/api/certificates/verify/[code]` | GET | Public verification | No |

### Users

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/users` | GET | List users | SUPER_ADMIN |
| `/api/users` | POST | Create user | SUPER_ADMIN |
| `/api/users/me` | GET | Get current user | Yes |
| `/api/users/me` | PUT | Update profile | Yes |
| `/api/users/me` | PATCH | Change password | Yes |
| `/api/users/[id]` | GET/PUT/DELETE | Manage user | SUPER_ADMIN |

### Dashboard

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/dashboard/stats` | GET | Dashboard statistics | Yes |

### Upload

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/upload` | POST | Upload file | Yes |
| `/api/upload` | GET | Get upload config | Yes |

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Full access to all features |
| `EVENT_MANAGER` | Manage events, speakers, sponsors |
| `REGISTRATION_MANAGER` | Manage registrations, attendees |
| `CERTIFICATE_MANAGER` | Generate and manage certificates |
| `ATTENDEE` | View own profile and registrations |

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [ ... ]
  }
}
```

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma migrate dev --name <name>  # Create migration
npx prisma studio    # Open database GUI
npx prisma db seed   # Run seed script (if configured)

# Type checking
npx tsc --noEmit     # Check TypeScript
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT encryption |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No | SMTP server port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASSWORD` | No | SMTP password |
| `SMTP_FROM` | No | Email sender address |
| `AWS_S3_BUCKET` | No | S3 bucket for uploads |
| `AWS_ACCESS_KEY_ID` | No | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | No | AWS secret key |
| `AWS_REGION` | No | AWS region |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

---

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset database (CAUTION: Deletes all data)
npx prisma db push --force-reset
```

### Prisma Client Issues
```bash
# Regenerate client after schema changes
npx prisma generate

# Clear cache
rm -rf node_modules/.prisma
npm install
```

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your app URL
- Clear browser cookies and local storage

---

## Deployment Checklist

- [ ] Set production environment variables
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Build application: `npm run build`
- [ ] Configure file storage (S3/Cloudinary)
- [ ] Set up SMTP for emails
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring and logging

---

## Support

For issues, contact the development team or open an issue in the repository.
