# ALOO

A lightweight CRM for local business lead generation. Search businesses by type and city, score leads based on their digital presence, and manage your sales pipeline.

## Features

- **Business Search** - Find local businesses via Google Maps API
- **Lead Scoring** - Automatic scoring (0-100) based on missing website, phone, reviews, etc.
- **CRM Pipeline** - Track leads through stages: New → Contacted → Called → Proposal → Negotiating → Won/Lost
- **Contact Logging** - Record calls, emails, meetings with outcomes
- **Tags** - Organize leads with custom colored tags
- **Dashboard** - View pipeline stats, hot/cold leads, conversion rates

## Quick Start

```bash
# Clone and enter directory
git clone https://github.com/Oguz0z/aloo.git
cd aloo

# Run setup (handles everything!)
./scripts/setup.sh
```

That's it! The setup script will:
1. Install dependencies
2. Let you choose SQLite (simple) or PostgreSQL (Docker)
3. Generate all secrets automatically
4. Set up the database
5. Create your user account

Then just run:
```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) and login.

## Manual Setup

If you prefer to set things up manually:

```bash
# Install dependencies
npm install

# Copy and edit environment file
cp .env.example .env
# Edit .env - generate secrets with: openssl rand -base64 32

# For SQLite (default, no Docker needed):
# DATABASE_URL is already set to "file:./data/aloo.db"

# For PostgreSQL (requires Docker):
# Uncomment the PostgreSQL DATABASE_URL in .env
docker compose up -d

# Setup database
npm run db:generate
npm run db:push

# Create your user
npm run setup:user

# Start the app
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite: `file:./data/aloo.db` or PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Auth encryption key |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000) |
| `ADMIN_SECRET` | Yes | Secret for /admin user management |
| `ENCRYPTION_SECRET` | Yes | API key encryption |
| `RAPIDAPI_KEY` | No | For Google Maps search |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (database GUI)
npm run setup:user   # Create/update user
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

## Database Options

### SQLite (Default)
- Zero configuration
- No Docker required
- Perfect for local development and small deployments
- Data stored in `data/aloo.db`

### PostgreSQL
- Production-ready
- Better for concurrent users
- Requires Docker: `docker compose up -d`

## Tech Stack

- **Framework**: Next.js 16, React 19
- **Database**: SQLite or PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (credentials)
- **Styling**: TailwindCSS v4
- **UI**: Radix UI, Lucide Icons

## Troubleshooting

### Database Issues

```bash
# Reset database (SQLite)
rm -rf data/aloo.db
npm run db:push

# Reset database (PostgreSQL)
docker compose down -v
docker compose up -d
npm run db:push
```

### Port Conflicts

```bash
# Check what's using port 3000
lsof -i :3000

# For PostgreSQL port 5433
lsof -i :5433
```

## Author

Built by [Oguz](https://github.com/Oguz0z)

## License

MIT
