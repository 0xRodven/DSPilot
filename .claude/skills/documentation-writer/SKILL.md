---
name: documentation-writer
description: Write clear technical documentation - API docs, user guides, architecture docs, READMEs, changelogs, and release notes following best practices.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Documentation Writer Skill

## When to Use
- Writing API documentation
- Creating user guides
- Documenting architecture
- Writing README files
- Creating changelogs and release notes

## Documentation Types

### 1. README.md

```markdown
# Project Name

Short description of what this project does.

## Features

- Feature 1
- Feature 2
- Feature 3

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## Usage

Basic usage example with code.

## Documentation

Link to full documentation.

## Contributing

How to contribute to the project.

## License

MIT License - see LICENSE file.
```

### DSPilot README Template

```markdown
# DSPilot

Real-time driver performance platform for Amazon DSPs.

[![Demo](https://img.shields.io/badge/demo-live-green)](https://dspilot.app)
[![License](https://img.shields.io/badge/license-proprietary-blue)]()

## What is DSPilot?

DSPilot helps Amazon Delivery Service Partners (DSPs) track driver performance, coach effectively, and improve DWC scores.

**Key Features:**
- 📊 Import Amazon DWC/IADC reports in 60 seconds
- 📈 Real-time driver performance dashboard
- 🎯 Structured coaching pipeline with follow-ups
- 📱 WhatsApp integration for driver communication
- 📄 Automated weekly recap generation

## Getting Started

### Prerequisites

- Node.js 22+
- npm or yarn
- Convex account
- Clerk account

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/dspilot.git
cd dspilot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
\`\`\`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (for WhatsApp) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Convex (real-time database)
- **Auth**: Clerk (multi-tenant)
- **UI**: shadcn/ui components

## Project Structure

\`\`\`
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui base components
│   ├── dashboard/   # Dashboard-specific components
│   └── layout/      # Layout components
├── lib/             # Utilities and helpers
│   ├── parser/      # Amazon report parser
│   ├── utils/       # Helper functions
│   └── store.ts     # Zustand store
convex/
├── schema.ts        # Database schema
├── drivers.ts       # Driver queries/mutations
├── coaching.ts      # Coaching queries/mutations
└── imports.ts       # Import handling
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npx convex dev` | Start Convex dev server |
| `npx convex deploy` | Deploy to production |

## Documentation

- [User Guide](docs/USER_GUIDE.md)
- [API Reference](docs/API.md)
- [Architecture](spec/ARCHITECTURE.md)

## License

Proprietary - All rights reserved.
```

### 2. API Documentation

```markdown
# API Reference

## Overview

DSPilot uses Convex for real-time data operations. All queries and mutations are type-safe and automatically synchronized.

## Authentication

All API calls require authentication via Clerk. Include the session token in requests.

## Drivers

### Get All Drivers

\`\`\`typescript
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

const drivers = useQuery(api.drivers.getDrivers, {
  stationId: "station_123",
  period: "week",
})
\`\`\`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| stationId | Id<"stations"> | Yes | Station identifier |
| period | "day" \| "week" \| "month" | No | Time period filter |

**Returns:**
\`\`\`typescript
Array<{
  _id: Id<"drivers">
  name: string
  transporterId: string
  dwcPercent: number
  tier: "fantastic" | "great" | "fair" | "poor"
  errors: { type: string; count: number }[]
}>
\`\`\`

### Get Driver by ID

\`\`\`typescript
const driver = useQuery(api.drivers.getDriverById, {
  driverId: "driver_123",
})
\`\`\`

### Update Driver

\`\`\`typescript
const updateDriver = useMutation(api.drivers.updateDriver)

await updateDriver({
  driverId: "driver_123",
  notes: "Good improvement this week",
})
\`\`\`

## Coaching

### Create Coaching Action

\`\`\`typescript
const createAction = useMutation(api.coaching.createAction)

await createAction({
  driverId: "driver_123",
  actionType: "discussion",
  reason: "DWC dropped below 90%",
  notes: "Discussed photo quality issues",
  scheduledFollowUp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
})
\`\`\`

**Action Types:**
| Type | Description |
|------|-------------|
| `discussion` | Initial conversation about performance |
| `warning` | Formal warning issued |
| `training` | Remedial training assigned |
| `suspension` | Temporary suspension |

### Update Coaching Outcome

\`\`\`typescript
const updateOutcome = useMutation(api.coaching.updateOutcome)

await updateOutcome({
  actionId: "action_123",
  outcome: "improved",
  notes: "DWC improved to 95%",
})
\`\`\`

**Outcome Types:**
| Outcome | Description |
|---------|-------------|
| `improved` | Performance improved after action |
| `no_effect` | No change observed |
| `escalated` | Issue escalated to next level |

## Imports

### Create Import

\`\`\`typescript
const createImport = useMutation(api.imports.createImport)

const importId = await createImport({
  stationId: "station_123",
  reportType: "dwc",
  reportDate: Date.now(),
  csvContent: "base64_encoded_csv_data",
})
\`\`\`

### Get Import Status

\`\`\`typescript
const importStatus = useQuery(api.imports.getImportStatus, {
  importId: "import_123",
})

// Returns: "pending" | "processing" | "success" | "partial" | "failed"
\`\`\`

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `UNAUTHORIZED` | Missing or invalid auth | Check Clerk session |
| `NOT_FOUND` | Resource doesn't exist | Verify ID is correct |
| `VALIDATION_ERROR` | Invalid input | Check parameters |
| `RATE_LIMITED` | Too many requests | Wait and retry |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Queries | 1000/minute |
| Mutations | 100/minute |
| Imports | 10/minute |
```

### 3. User Guide

```markdown
# DSPilot User Guide

## Getting Started

### 1. Sign Up

1. Go to [dspilot.app](https://dspilot.app)
2. Click "Start Free Trial"
3. Create your account with email or Google
4. Enter your station code

### 2. Import Your First Report

1. Download your DWC report from Amazon
2. Click "Import" in DSPilot
3. Paste the HTML content
4. Click "Import Report"

Your driver data will appear in 60 seconds.

## Dashboard Overview

### KPI Cards

The top row shows your key metrics:
- **Fleet DWC**: Overall performance percentage
- **Active Drivers**: Number of drivers with data
- **Coaching Pending**: Drivers needing attention
- **Active Alerts**: Issues requiring action

### Tier Distribution

Drivers are categorized by performance:
| Tier | DWC Range | Color |
|------|-----------|-------|
| Fantastic | ≥98.5% | Green |
| Great | 96-98.5% | Blue |
| Fair | 90-96% | Amber |
| Poor | <90% | Red |

### Drivers Table

Click any driver to see:
- Performance history
- Error breakdown
- Coaching history
- Contact options

## Coaching Workflow

### 1. Identify Drivers

Use the "Coaching" tab to see drivers needing attention:
- Poor performers (DWC < 90%)
- Declining trends
- Missed follow-ups

### 2. Create Coaching Action

1. Click on a driver
2. Click "Add Coaching Action"
3. Select action type:
   - Discussion (first step)
   - Warning (formal notice)
   - Training (skill building)
   - Suspension (last resort)
4. Add notes and schedule follow-up

### 3. Track Outcomes

After the follow-up date:
1. Review driver's new performance
2. Update the coaching action with outcome
3. Escalate if needed

## WhatsApp Integration

### Setup

1. Go to Settings → WhatsApp
2. Connect your Twilio account
3. Add your WhatsApp business number

### Send Messages

1. Click a driver's profile
2. Click "Message via WhatsApp"
3. Use templates or write custom message
4. Send directly from DSPilot

## Weekly Recaps

### Generate Recap

1. Go to Reports → Weekly Recap
2. Select the week
3. Click "Generate"
4. Choose format: PDF or WhatsApp

### What's Included

- Station DWC summary
- Top and bottom performers
- Week-over-week comparison
- Personalized coaching tips

## Settings

### Station Settings

- Station code
- Timezone
- DWC thresholds

### Notification Preferences

- Email alerts
- In-app notifications
- Alert thresholds

### Team Management

- Invite team members
- Assign roles
- Manage permissions

## FAQ

**Q: How often should I import reports?**
A: Daily imports give you the most accurate real-time data.

**Q: Can multiple people use the same station?**
A: Yes! Invite team members from Settings.

**Q: How is DWC calculated?**
A: DWC = (Delivered Without Customer Contact / Total Deliveries) × 100

## Support

- Email: support@dspilot.app
- In-app chat: Click the help icon
- Documentation: docs.dspilot.app
```

### 4. Architecture Documentation

```markdown
# DSPilot Architecture

## Overview

DSPilot is a real-time SaaS platform for Amazon DSP driver performance management.

## System Architecture

\`\`\`
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Next.js App   │────▶│     Clerk       │
│   (Frontend)    │     │   (Auth)        │
│                 │     │                 │
└────────┬────────┘     └─────────────────┘
         │
         │ Real-time sync
         ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│     Convex      │────▶│    Twilio       │
│   (Backend)     │     │   (WhatsApp)    │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
\`\`\`

## Technology Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19**: UI library with Server Components
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Zustand**: Client state management

### Backend
- **Convex**: Real-time database and backend
- **Clerk**: Authentication and user management

### Integrations
- **Twilio**: WhatsApp messaging
- **Vercel**: Hosting and deployment

## Data Flow

### Import Flow

\`\`\`
1. User pastes Amazon HTML report
2. Client-side parser extracts CSV
3. CSV sent to Convex mutation
4. Data validated and stored
5. Real-time update to all connected clients
\`\`\`

### Real-Time Updates

Convex provides automatic real-time synchronization:
- All queries are reactive
- Changes propagate instantly
- No manual refresh needed

## Database Schema

### Core Tables

\`\`\`typescript
// stations - DSP stations
{
  code: string        // Amazon station code
  orgId: string       // Clerk organization ID
  settings: object    // Station preferences
}

// drivers - Driver records
{
  stationId: Id       // Reference to station
  transporterId: string
  name: string
  phone?: string
}

// performance - Daily snapshots
{
  driverId: Id
  date: number
  dwcPercent: number
  iadcPercent: number
  errors: object[]
}

// coaching - Coaching actions
{
  driverId: Id
  actionType: string
  reason: string
  outcome?: string
  scheduledFollowUp?: number
}
\`\`\`

### Indexes

Performance-critical queries use indexes:
- `drivers.by_station`: Find drivers by station
- `performance.by_driver_date`: Historical data
- `coaching.by_driver`: Driver's coaching history

## Security

### Authentication
- Clerk handles all auth flows
- JWT tokens for API access
- Organization-based multi-tenancy

### Data Isolation
- All queries filtered by organization
- Row-level security in Convex
- No cross-tenant data access

### Sensitive Data
- Passwords never stored (Clerk handles)
- API keys in environment variables
- WhatsApp tokens encrypted

## Deployment

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:3005 | Local development |
| Staging | staging.dspilot.app | Pre-production testing |
| Production | dspilot.app | Live users |

### CI/CD Pipeline

\`\`\`
1. Push to main branch
2. GitHub Actions runs tests
3. Convex deployment
4. Vercel deployment
5. Slack notification
\`\`\`

## Monitoring

- **Convex Dashboard**: Query performance, errors
- **Vercel Analytics**: Page performance
- **Clerk Dashboard**: User activity
- **Custom Alerts**: DWC threshold alerts
```

### 5. Changelog

```markdown
# Changelog

All notable changes to DSPilot are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- WhatsApp message templates
- Bulk driver selection

### Changed
- Improved import speed by 40%

### Fixed
- Date picker timezone issues

---

## [1.2.0] - 2025-01-07

### Added
- 📊 KPI alerts system with configurable thresholds
- 📄 PDF export for weekly recaps
- 🔔 In-app notifications

### Changed
- Improved mobile responsive design
- Updated tier color scheme for accessibility

### Fixed
- Import validation for malformed HTML
- Coaching pipeline sort order

---

## [1.1.0] - 2025-01-01

### Added
- 📱 WhatsApp integration via Twilio
- 📈 Historical trend charts
- 🎯 Coaching pipeline kanban view

### Changed
- Moved to Next.js 16 App Router
- Upgraded to React 19

### Deprecated
- Legacy pages/ directory (removed in 1.2.0)

### Fixed
- DWC calculation rounding errors
- Session timeout handling

---

## [1.0.0] - 2024-12-15

### Added
- Initial release
- Amazon HTML report import
- Real-time driver dashboard
- Basic coaching tracking
- Tier classification system
```

## Writing Best Practices

### DO
- Use clear, simple language
- Include code examples
- Keep sections focused
- Update docs with code changes
- Test all code samples
- Use consistent formatting

### DON'T
- Assume prior knowledge
- Write walls of text
- Leave docs outdated
- Skip error handling in examples
- Use jargon without explanation
- Forget about non-technical users

## DO NOT
- Document features that don't exist
- Include sensitive information (keys, passwords)
- Copy documentation from other products
- Write without considering the audience
- Forget to version documentation
