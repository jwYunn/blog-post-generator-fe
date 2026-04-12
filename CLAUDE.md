# Blog Post Generator — Frontend

React + TypeScript SPA that provides the management UI for the blog post generation pipeline.

## Tech Stack

- **Framework**: React 19 + TypeScript 5.7 + Vite 6
- **Data Fetching**: TanStack Query 5 (polling, mutations, cache invalidation)
- **Routing**: React Router DOM 7
- **Forms**: React Hook Form 7 + Zod 4 (validation)
- **UI**: Tailwind CSS 3 + Headless UI 2 (Dialog, Combobox) + Lucide React (icons)
- **HTTP**: Axios (base URL from `VITE_API_BASE_URL` env var, default `http://localhost:3000`)

## Documentation

Read these files before suggesting features or changes:

- [Overview & Architecture](docs/overview.md) — routes, project structure, state management approach
- [Pages](docs/pages.md) — per-page purpose, API calls, polling logic, key state
- [Components](docs/components.md) — all shared components with props
- [API & Types](docs/api-and-types.md) — API layer, all TypeScript types and interfaces
- [Patterns](docs/patterns.md) — polling, modal, form, toast, pagination, debounce patterns

## Language Rules

- **Commit messages**: English only
- **Code comments**: English only
- **Variable/function/class names**: English only

## Key Conventions

- All API calls are centralized in `src/api/` — never call Axios directly from pages/components
- Query keys follow `['resource', params]` or `['resource', id]` pattern
- Polling is done via TanStack Query `refetchInterval` — not `setInterval`
- Modals use Headless UI `Dialog` with `open` boolean + data state
- Toasts use the `useToast()` hook from `src/hooks/useToast.ts`
- Forms always use React Hook Form + Zod schema — no uncontrolled inputs
- Status badges reference `STATUS_CONFIG` / `CATEGORY_STYLES` maps — don't hardcode colors inline
- `IN_PROGRESS_STATUSES` constant in `src/types/articleDraft.ts` drives all polling logic for drafts
