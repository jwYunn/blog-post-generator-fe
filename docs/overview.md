# Overview & Architecture

## Purpose

Single-page application for managing the blog post generation pipeline. Provides UI for:
- Creating and managing seed keywords
- Reviewing AI-generated topic candidates and approving them
- Monitoring article draft generation progress
- Publishing to Tistory
- Managing API sources and generating custom thumbnails

## Project Structure

```
src/
├── api/                    — Axios API clients (one file per BE module)
│   ├── topicSeed.ts
│   ├── topicCandidate.ts
│   ├── articleDrafts.ts
│   ├── publishRecords.ts
│   ├── apiSource.ts
│   └── thumbnailGenerator.ts
│
├── types/                  — TypeScript interfaces and enums
│   ├── topicSeed.ts
│   ├── topicCandidate.ts
│   ├── articleDraft.ts
│   ├── apiSource.ts
│   └── thumbnail.ts
│
├── hooks/
│   └── useToast.ts         — Toast notification state
│
├── pages/                  — Route-level page components
│   ├── TopicSeedPage.tsx
│   ├── TopicCandidatePage.tsx
│   ├── ArticleDraftListPage.tsx
│   ├── ArticleDraftDetailPage.tsx
│   ├── PublishHistoryPage.tsx
│   ├── ApiSourcePage.tsx
│   └── ThumbnailGeneratorPage.tsx
│
├── components/
│   ├── Layout.tsx           — App shell with top nav
│   ├── Toast.tsx            — Toast container
│   ├── topic-seed/          — Seed-specific components
│   ├── topic-candidate/     — Candidate-specific components
│   └── article-draft/       — Draft-specific components
│
└── App.tsx                  — Route definitions + QueryClient setup
```

## Routes

| Path | Page | Notes |
|------|------|-------|
| `/` | Redirect to `/topic-seeds` | |
| `/topic-seeds` | `TopicSeedPage` | |
| `/topic-candidates` | `TopicCandidatePage` | Accepts `?seedId=` query param |
| `/article-drafts` | `ArticleDraftListPage` | |
| `/article-drafts/:id` | `ArticleDraftDetailPage` | |
| `/publish-history` | `PublishHistoryPage` | |
| `/api-sources` | `ApiSourcePage` | |
| `/thumbnail-generator` | `ThumbnailGeneratorPage` | |

## Navigation (Layout.tsx)

Top navigation bar with these tabs (in order):
1. Topic Seeds — `/topic-seeds` (Sprout icon)
2. Topic Candidates — `/topic-candidates` (Lightbulb icon) — candidates from every seed; clicking a seed row opens it filtered to that seed
3. Article Drafts — `/article-drafts` (FileText icon)
4. Publish History — `/publish-history` (Globe icon)
5. API Sources — `/api-sources` (Database icon)
6. Thumbnail Generator — `/thumbnail-generator` (ImageIcon icon)

The pipeline pages link to each other both ways: an approved candidate links to its draft, and a draft's detail page links back to its seed.

## State Management

| Layer | Tool | What it manages |
|-------|------|----------------|
| Server state | TanStack Query | API data, caching, polling, mutations |
| Local UI state | `useState` | Modals, loading indicators, pagination, view modes |
| URL state | `useSearchParams` | `?seedId=` in TopicCandidatePage — the only source of the seed filter |
| Ref state | `useRef` | Polling timeouts, previous values for change detection |

## QueryClient Configuration

```typescript
// App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,  // 30 seconds global default
    },
  },
})
```

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Backend base URL | `http://localhost:3000` |

## Polling Constants

All polling uses consistent timing across the app:

```typescript
const POLL_INTERVAL_MS = 3_000   // 3 seconds
const POLL_TIMEOUT_MS = 120_000  // 2 minutes
```

Used in: `TopicCandidatePage`, `ThumbnailGeneratorPage`

For article drafts: `refetchInterval` is set conditionally based on `IN_PROGRESS_STATUSES` (no manual timeout).
