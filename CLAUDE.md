# ALOO

A Next.js lead generation platform for finding local businesses that need digital services. Search by industry type and city, score leads based on their digital presence, and manage them in a lightweight CRM.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── business/       # Business search & geocode
│   │   ├── leads/          # Lead CRUD & contact logs
│   │   └── settings/       # API key management
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (search, results, CRM)
├── components/             # React components
│   ├── search/             # Search UI
│   │   ├── BusinessTypeSelector.tsx
│   │   ├── CityInput.tsx
│   │   └── WelcomeHeader.tsx
│   ├── leads/              # Lead management
│   │   ├── LeadScoreBadge.tsx
│   │   ├── LeadStatusBadge.tsx
│   │   ├── StatusSelector.tsx
│   │   └── OpportunitiesList.tsx
│   ├── dashboard/          # Pipeline stats
│   ├── settings/           # Settings modal
│   └── ui/                 # Generic UI components
├── lib/                    # Utilities and API clients
│   ├── business/           # Business logic
│   │   ├── geocode.ts      # City geocoding (Nominatim)
│   │   ├── scoring.ts      # Lead score calculation
│   │   ├── opportunities.ts # Industry opportunities
│   │   └── search.ts       # RapidAPI Maps search
│   ├── rapidapi/           # RapidAPI client
│   ├── constants.ts        # Industry types, statuses
│   ├── db.ts               # Prisma client
│   └── errors.ts           # Error handling
└── types/                  # TypeScript definitions

prisma/
└── schema.prisma           # Database schema (Lead, BusinessSearch, ContactLog)
```

## Key Features

- **Business Search**: Search by industry type + city via RapidAPI Maps
- **Lead Scoring**: Score 0-100 based on missing website (+30), phone (+25), email (+20), high rating (+10), low reviews (+10)
- **Opportunities**: Industry-specific service recommendations
- **CRM**: Status tracking (new → contacted → called → proposal_sent → negotiating → won/lost)
- **Contact Logs**: Track calls, emails, meetings, notes

## Organization Rules

**Keep code organized and modularized:**
- API routes → `src/app/api/`, one folder per resource
- Components → `src/components/`, grouped by feature
- Business logic → `src/lib/business/`
- Types → `src/types/`

**Modularity principles:**
- Single responsibility per file
- Clear, descriptive file names
- Group related functionality together
- Use barrel exports (index.ts) for clean imports

## Code Quality - Zero Tolerance

After editing ANY file, run:

```bash
npm run lint && npm run typecheck
```

Fix ALL errors/warnings before continuing.

### Additional Commands

```bash
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
npm run db:generate   # Generate Prisma client after schema changes
npm run db:migrate    # Run database migrations
```

### Server Restart

If changes require server restart (not hot-reloadable):
1. Restart server: `npm run dev`
2. Read server output/logs
3. Fix ALL warnings/errors before continuing
