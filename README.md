# Blog Post Generator — Admin UI

A browser-based admin interface for managing and monitoring an AI-powered blog post generation pipeline. This frontend exists to make a complex multi-stage backend workflow operable without direct database or queue access.

The backend system this UI controls: [blog-post-generator](https://github.com/jwYunn/blog-post-generator)

---

## Purpose

The backend pipeline involves multiple asynchronous stages — topic generation, AI evaluation, outline and content creation, thumbnail generation, and Tistory publishing — each with its own state, data, and failure modes.

This UI provides:
- A way to trigger and monitor each pipeline stage
- Human review checkpoints before irreversible operations (publish)
- Visibility into live job progress via status polling
- Copy-ready outputs for content reuse

It is designed as an internal operator tool, not a public-facing product.

---

## Core Screens

### Topic Seeds
The entry point of the pipeline. Users create and manage keyword seeds (e.g., `"run vs jog"`, category: `difference`) which drive all downstream content generation.

- Create / edit / soft-delete seeds
- Filter by category, active status, and keyword search
- Trigger AI topic generation and evaluation per seed

### Topic Candidates
Displays AI-generated topic candidates for each seed, with evaluation scores and metadata.

- Review candidates with scores, strengths/weaknesses, and verdict labels
- Sort by score or rank (from GPT-4o evaluation)
- Approve or reject individual candidates
- Approved candidates automatically trigger article draft creation

### Article Drafts
Central workflow management screen. Lists all article drafts with real-time status tracking.

- Status-based filtering (10 pipeline states)
- Live status polling (3-second refresh) for in-progress drafts
- Per-row publish action for `review_ready` drafts
- Inline hashtag display with one-click copy

### Article Draft Detail
Per-draft view for inspecting and acting on each pipeline stage.

- Pipeline step navigator (Outline → Content → Thumbnail → Review)
- Markdown / HTML / Preview toggle for content inspection
- Copy buttons for title, content (Markdown or HTML), and individual hashtags
- Thumbnail preview
- Publish modal with immediate or scheduled publish options
- Publish records section for completed drafts

### Publish History
A log of all published articles across all drafts.

- Paginated list with permalink, publish mode, and timestamp
- Links to live Tistory posts

### Thumbnail Generator
Standalone tool for generating AI image thumbnails via Replicate (Flux Schnell).

- Input custom prompts, trigger generation jobs
- Poll for completion status
- Preview generated images and mark active selection

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Routing | React Router 7 |
| Server state | TanStack Query v5 |
| Forms + validation | React Hook Form + Zod |
| Styling | Tailwind CSS |
| Headless UI | Headless UI (modals, dialogs) |
| HTTP | Axios |
| Icons | Lucide React |
| Markdown | react-markdown, marked |

---

## UI Structure

```
src/
├── api/              # Axios instances and endpoint functions, one file per domain
├── components/
│   ├── article-draft/    # Pipeline-specific components (content, outline, hashtags, etc.)
│   ├── topic-seed/       # Seed management components
│   └── topic-candidate/  # Candidate table and filter components
├── hooks/            # useToast
├── pages/            # One page component per route
├── types/            # TypeScript interfaces mirroring backend entities and DTOs
└── App.tsx           # Route definitions
```

Each API module creates its own Axios instance pointed at `VITE_API_BASE_URL`. No shared global interceptor — keeps modules independently testable and easy to reason about.

---

## State and Interaction Flow

### Server State

All remote data is managed through TanStack Query. Key behaviors:

- **Polling** — Article draft list and detail pages poll every 3 seconds when any draft has an in-progress status (`queued`, `generating_outline`, `generating_content`, etc.). Polling stops automatically when all visible drafts reach a terminal state.
- **Cache invalidation** — Mutations (approve, publish, delete) call `queryClient.invalidateQueries` to refetch affected lists immediately.
- **Stale time** — Set to 30 seconds globally to avoid redundant refetches during normal navigation.

### Draft Status as UI State

The `ArticleDraftStatus` enum drives most of the detail page's rendering logic:

- Which pipeline steps are clickable
- Whether the publish button is shown
- Whether to show the pipeline navigator or the publish records section
- Whether to display a progress spinner

This means the UI state is almost entirely derived from backend state — there is minimal local UI state beyond the currently selected pipeline step and modal open/close.

### Form Validation

React Hook Form + Zod handles form validation in modals (topic seed create/edit, publish scheduling). Zod schemas are defined inline with the form and used as the resolver — no separate validation layer.

---

## Local Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL (default: http://localhost:3000)

# Start dev server
npm run dev
```

The backend must be running separately. See [blog-post-generator](https://github.com/jwYunn/blog-post-generator) for backend setup instructions.

---

## Future Improvements

- **Authentication** — Currently no auth layer. Adding session-based or token-based auth would be the first step before any non-local deployment.
- **Error boundaries** — Per-section error boundaries would improve resilience when individual API calls fail mid-page.
- **Optimistic updates** — Candidate approve/reject and draft status updates could update the UI immediately rather than waiting for a refetch.
- **Keyboard shortcuts** — For high-volume review workflows, keyboard-driven approve/reject/copy actions would improve throughput.
- **Filtering persistence** — Status filters and sort state reset on navigation; persisting them in URL params would improve usability.
