# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000
npm run build            # Production build
npm run start            # Production server

# Code Quality (MUST run before committing)
npm run type-check       # TypeScript type checking
npm run lint            # ESLint code quality check
npm run format          # Prettier formatting
npm run format:check    # Check formatting without modifying

# Testing
npm run test            # Run Jest tests
npm run test:watch      # Watch mode testing
npm run test:coverage   # Test with coverage report

# Single test execution
npm run test -- button.test.tsx                          # Test specific file
npm run test:watch -- --testNamePattern="should render"  # Pattern matching
npm run test -- --testPathPattern=components            # Test directory
```

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.1.0 with App Router
- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **State Management**: TanStack Query v5 (server state) + Zustand v4 (client state)
- **UI Library**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS + CVA (class-variance-authority)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library
- **Animations**: Framer Motion v11
- **Drag & Drop**: @dnd-kit (sortable, core, utilities)

### Data Flow Architecture
```
┌─────────────────┐     ┌──────────────────┐
│   Next.js App   │────▶│   Supabase DB    │
│  (App Router)   │     │  (PostgreSQL)    │
└────────┬────────┘     └─────────┬────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  TanStack Query │     │   Realtime       │
│  (Server State) │     │  (WebSocket)     │
└─────────────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│    Zustand      │
│ (Client State)  │
└─────────────────┘
```

### Database Schema
- **3-tier hierarchy**: Teams → Goals → Projects → Tasks
- **Core tables**: users, teams, team_members, goals, projects, tasks, comments, attachments, activity_logs
- **Documentation tables**: documentation_templates, documentation_versions, documentation_metrics
- **Auth tables**: auth_sessions, auth_attempts (security tracking)
- **All tables have RLS policies and realtime enabled**

### Migration Files
1. `001_initial_schema.sql` - Core tables structure
2. `002_rls_policies.sql` - Row Level Security policies
3. `003_realtime_setup.sql` - Realtime configuration
4. `004_documentation_system.sql` - Documentation features
5. `005_auth_security_tables.sql` - Security and auth tracking
6. `006_enhanced_rls_security.sql` - Enhanced RLS security
7. `007_enhanced_data_integrity.sql` - Data integrity constraints
8. `008_performance_optimization_indexes.sql` - Performance indexes
9. `009_security_compliance_validation.sql` - Security compliance

## 📁 Project Structure

```
app/                    # Next.js App Router pages
├── api/               # API routes
│   └── documentation/ # Documentation generation endpoints
├── auth/              # Authentication pages (login, signup, callback)
├── dashboard/         # Main dashboard
└── (features)/        # Feature-specific pages

components/            # React components
├── ui/               # Base UI components (Button, Input, Card, etc.)
├── features/         # Feature-specific components
├── layouts/          # Layout components
└── dashboard/        # Dashboard components (header, sidebar)

lib/                   # Core library code
├── supabase/         # Supabase clients (client.ts, server.ts, middleware.ts)
├── auth/             # Authentication utilities
├── documentation/    # Documentation system
│   ├── automation/   # Workflow automation
│   ├── collectors/   # Code and progress collectors
│   ├── quality/      # Quality metrics and validation
│   ├── realtime/     # Realtime sync
│   └── types/        # TypeScript types
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
└── utils/            # Utility functions

supabase/             # Database configuration
└── migrations/       # SQL migration files (001-009)

types/                # TypeScript type definitions
├── supabase.ts      # Supabase types
└── database.generated.ts # Auto-generated DB types

__tests__/            # Test files
├── components/      # Component tests
└── lib/            # Library tests
└── documentation/   # Documentation system tests

docs/                 # Project documentation
├── DATABASE_SETUP.md # Database setup guide
├── reports/         # Auto-generated progress reports
├── components/      # Auto-generated component docs
└── api/            # Auto-generated API docs

scripts/             # Utility scripts
└── (automation scripts)
```

## 🔐 Authentication & Security

### Authentication Flow
1. **Public routes**: `/`, `/about`, `/contact`, `/privacy`, `/terms`
2. **Auth routes**: `/auth/login`, `/auth/signup`, `/auth/callback`, `/auth/reset-password`, `/auth/verify-email`, `/auth/account-locked`
3. **Protected routes**: `/dashboard`, `/profile`, `/settings`, `/teams`, `/projects`, `/goals`, `/tasks`
4. **Middleware** (`middleware.ts`): Comprehensive auth validation with:
   - Security headers for all routes
   - Rate limiting and CSRF protection (production)
   - Account lockout protection
   - Session management via Supabase
5. **Supabase clients**:
   - `lib/supabase/client.ts` - Browser environment
   - `lib/supabase/server.ts` - Server components
   - `lib/supabase/middleware.ts` - Auth validation

### Security Requirements (ISMS-P compliant)
- **Password policy**: 8+ chars with mixed characters OR 10+ chars alphanumeric
- **Account lockout**: 5 failed attempts = 5 min lockout
- **Encryption**: AES-256 for sensitive data, bcrypt/scrypt/Argon2 for passwords
- **Input validation**: All external inputs must be validated and sanitized
- **SQL queries**: Use parameterized queries only
- **Personal data**: Mask when displaying (e.g., John D**, test@***.com)
- **Logging**: Keep audit logs for 1+ year with [timestamp, user_id, IP, action, status]

## 🎨 UI Development Patterns

### Component Creation
1. Use Radix UI primitives when available
2. Place in `components/ui/` for base components
3. Use CVA for variant management
4. Follow existing patterns in the codebase

### State Management
- **Server state**: Use TanStack Query with 1min stale time, 5min gc time
- **Client state**: Use Zustand for UI state
- **Form state**: React Hook Form + Zod validation

### Styling Guidelines
- Use Tailwind utility classes
- Follow 8px grid system
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance
- Dark mode support via next-themes

## 🧪 Testing Patterns

### Test Setup
- Jest configuration in `jest.config.js`
- Setup file: `jest.setup.js` (mocks Next.js navigation, Supabase)
- Coverage targets: app/, components/, lib/ directories

### Test Mocks
- **Next.js navigation**: useRouter, useSearchParams, usePathname
- **Supabase**: Environment variables mocked
- **ResizeObserver**: Global mock for component tests
- **Web APIs**: Request, Headers classes mocked for Node.js environment
- **Console warnings**: Suppressed in tests (React, componentWillReceiveProps)

### Writing Tests
```typescript
// Component test example
import { render, screen } from '@testing-library/react'
import { ComponentName } from './component-name'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

## 📋 Documentation System

The project includes an automated documentation system (`lib/documentation/`):

- **Template Engine**: Handlebars-based dynamic generation
- **Code Collectors**: AST-based code analysis and metadata extraction
- **Quality Management**: Document validation and quality scoring
- **Realtime Sync**: Supabase Realtime integration
- **API Endpoints**: `/api/documentation/[masterplan|sync|metrics|cache]`

### GitHub Actions Workflow
- Automatically generates documentation on push to main branches
- Creates progress reports, component docs, and API documentation
- Runs daily at 9 AM KST (0:00 UTC)
- Workflow file: `.github/workflows/documentation.yml`

## ⚠️ Critical Development Rules

### Before ANY Code Changes
1. **Read existing code first** - Use Read tool before Write/Edit
2. **Check dependencies** - Verify libraries in package.json before using
3. **Follow patterns** - Match existing code style and conventions
4. **Test changes** - Run `npm run type-check` after modifications

### Git Workflow
1. **Never auto-commit** unless explicitly requested
2. **Commit message format**: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, perf, test, chore
3. **Run quality checks** before committing:
   ```bash
   npm run type-check && npm run lint && npm run format:check
   ```

### Performance Targets
- Initial load: < 3 seconds
- Interaction delay: < 100ms
- Bundle size: < 500KB
- Test coverage: > 70%

## 🚫 Prohibited Actions

### Never Do
- Hard-code passwords or API keys
- Leave console.log in production code
- Use `any` type excessively
- Create files unless absolutely necessary
- Auto-generate documentation unless requested
- Use relative paths in imports (use @/ alias)
- Make dynamic SQL queries (use parameterized only)
- Expose stack traces or DB info in errors
- Commit .env files

### Avoid
- Files > 300 lines
- Nesting > 5 levels
- Synchronous API call chaining
- Global state abuse
- Excessive inline styles

## 🔄 Development Workflow

### Feature Development
1. Use Context7 MCP for latest framework docs
2. Apply TDD cycle (Red → Green → Refactor)
3. Follow clean code principles (DRY, KISS, YAGNI, SOLID)
4. Run `npm run type-check`
5. Commit with appropriate type (feat)

### Bug Fixing
1. Write reproducible test first
2. Fix with minimal code changes
3. Add regression tests
4. Run `npm run type-check`
5. Commit with fix type

### Refactoring
1. Verify test coverage exists
2. Refactor incrementally
3. Run tests after each step
4. Run `npm run type-check`
5. Commit with refactor type

## 📊 Environment Setup

```bash
# Required environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Optional, for server-side operations
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional environment variables (see .env.example for full list)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... # For browser-safe RLS operations
SUPABASE_SECRET_KEY=sb_secret_... # For backend operations
```

## 🧪 Testing Strategy

- **Unit tests** (70%): Business logic and utilities
- **Integration tests** (20%): API endpoints and DB interactions  
- **E2E tests** (10%): Core user workflows
- **Test location**: `__tests__/` directory
- **Coverage targets**: app/, components/, lib/ directories
- **Test isolation**: Each test should be independent

## 📚 Key References

- Database setup: `docs/DATABASE_SETUP.md`
- Progress reports: `docs/reports/`
- Latest docs via Context7 MCP for: Next.js 15, Supabase, Radix UI, TanStack Query, Zustand
- GitHub Actions workflows: `.github/workflows/`
- Project README: `README.md` (Korean) - Contains project overview, roadmap, and setup instructions

## 🌏 Project Context

This is **PM System 2025** - a lightweight project management tool designed for small teams (1-5 people) and individuals. The system follows a **3-tier hierarchy**: Teams → Goals → Projects → Tasks with 6 different view systems (table, kanban, calendar, timeline, gallery, list).

### Key Features
- Hierarchical task management (Goals → Projects → Tasks)
- Real-time collaboration with Supabase Realtime
- Multiple view systems with drag & drop
- PWA support for offline functionality
- ISMS-P compliant security standards
- Automated documentation system

**Remember**: Keep it simple, secure, and performant. Focus on essential features for small team productivity.