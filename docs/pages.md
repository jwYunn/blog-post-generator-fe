# Pages

Each page is a route-level component in `src/pages/`. Pages own data fetching, polling, and modal state. Sub-components handle rendering.

---

## TopicSeedPage

**File**: `src/pages/TopicSeedPage.tsx`
**Route**: `/topic-seeds`

### Purpose
CRUD management of seed keywords that trigger the generation pipeline.

### API Calls
- `topicSeedApi.getList(params)` — paginated list with filters
- `topicSeedApi.create(body)` — create new seed
- `topicSeedApi.update(id, body)` — update seed
- `topicSeedApi.delete(id)` — soft delete

### State
- Query params: `page`, `limit`, `category`, `isActive`, `search`, `sortBy`, `order`
- Modal: `formTarget` (`undefined` = closed, `null` = create, `TopicSeed` = edit)
- Modal: `deleteTarget` (`null` = closed, `TopicSeed` = confirm delete)

### Key Features
- Search with 300ms debounce (in `TopicSeedFilters`)
- Category filter, active/inactive toggle
- Multi-column sorting: `createdAt`, `priority`, `usedCount`
- Clicking a row navigates to `/topic-candidates?seedId=<id>`

---

## TopicCandidatePage

**File**: `src/pages/TopicCandidatePage.tsx`
**Route**: `/topic-candidates`

### Purpose
Generate topic candidates for a selected seed and approve them. Polling-based UI for async job status.

### API Calls
- `topicCandidateApi.getList(params)` — candidate list (polled)
- `topicSeedApi.getOne(seedId)` — the selected seed, for the context bar and whether Generate is allowed (`['topic-seeds', seedId]`). Fetched on its own so it never depends on the list below
- `topicSeedApi.getAll()` — every seed, for the seed dropdown and the seed names on rows in the all-seeds view (`['topic-seeds', 'all']`)
- `topicSeedApi.generate(seedId)` — enqueue generation job
- `topicSeedApi.evaluate(seedId)` — enqueue a re-score (the "Re-score" button)
- `topicCandidateApi.updateStatus(id, { status: 'approved' })` — via `TopicCandidateTable`; the page toasts an "Open draft" link to the returned `articleDraftId`

### State
- `seedId` from `useSearchParams` (`?seedId=`) — read straight from the URL, not copied into state, because the nav, seed rows and draft pages all link here while the page may already be mounted. A seed change resets to page 1 and stops any generate/score polling
- `filters` — page, limit, status, sort (everything except the seed)
- `isGenerating` / `isEvaluating` — polling active flags
- `prevTotalRef` — ref to previous candidate count (generation completion detection)
- `scoreBaselineRef` — latest timestamp on screen when scoring started (scoring completion detection)
- Polling timeout refs: auto-cancel after 2 minutes

### Polling Logic
**Generation**: Polls candidate list every 3s. When `data.total` increases compared to `prevTotalRef`, generation is done — but the server chains an evaluation straight after it, so polling carries on as scoring, baselined on the newest `createdAt`.

**Scoring** (after generation, or from Re-score): Polls every 3s. Stops once some row's `updatedAt` is newer than the baseline and no pending row on screen is left without an `overallScore`. Re-score baselines on the newest `updatedAt`, since scoring rewrites every pending candidate even when it already had a score.

### Key Features
- Seed context bar at top (category badge, priority, active status)
- Unfiltered ("All seeds"), each row links to its seed under the title
- Approved candidates show a **Draft** link (`articleDraftId`) in place of Approve
- Generate and Re-score buttons side by side
- Loading banners with cancel buttons during polling
- Sorts candidates by rank/score by default after evaluation

---

## ArticleDraftListPage

**File**: `src/pages/ArticleDraftListPage.tsx`
**Route**: `/article-drafts`

### Purpose
List view of all article drafts with status-based filtering and auto-polling while generation is in progress.

### API Calls
- `articleDraftApi.getList(params)` — draft list (conditionally polled)

### Polling Logic
```typescript
refetchInterval: (query) => {
  const drafts = query.state.data?.data ?? []
  return drafts.some(d => IN_PROGRESS_STATUSES.includes(d.status))
    ? 3_000
    : false
}
```
Automatically stops polling once all drafts reach a terminal state. Drafts published from this page are tracked in `publishRequestedIds` state: until the worker moves them off `review_ready` they show "Queued" instead of a Publish button and keep the list polling.

### Key Features
- Status filter chips (including Publishing / Published)
- Inline hashtag pills with copy-all button (tab-separated)
- `formatRelativeTime()` for relative timestamps ("5m ago")
- Skeleton loading rows
- Row click → `/article-drafts/:id`

---

## ArticleDraftDetailPage

**File**: `src/pages/ArticleDraftDetailPage.tsx`
**Route**: `/article-drafts/:id`

### Purpose
Detailed view of a single draft with interactive pipeline visualization and content preview.

### API Calls
- `articleDraftApi.getOne(id)` — polled every 3s while in-progress, or while the latest attempt is in flight
- `articleDraftApi.getPublishRecords(draftId)` — always fetched; polled while the latest attempt is in flight (`isAttemptInFlight`). A publish request leaves the draft at `review_ready` until the worker picks it up, so the attempt record is what shows it is under way

### State
- `selectedStep` — which pipeline step the user is viewing (`'outline' | 'content' | 'thumbnail' | 'review' | null`)
- `publishModalOpen` — controls PublishModal visibility
- `resolveTarget` — the stuck attempt open in `ResolveAttemptDialog`
- Derived: `failedStage` (`getFailedStage`) — a failed draft with publish records failed while publishing, otherwise at the first generation step with no output
- Derived: `canPublish` — `review_ready`, or a publish failure with content (shown as "Retry Publish"), and no attempt that is `attempting`/`published`
- Auto-advances `selectedStep` to the latest available step on data change

### Pipeline Steps
| Step key | Requires | Shows |
|----------|----------|-------|
| `outline` | `draft.outline !== null` | `ArticleDraftOutlineSection` |
| `content` | `draft.content !== null` | `ArticleDraftContentSection` |
| `thumbnail` | `draft.thumbnailImageUrl !== null` | Thumbnail image preview |
| `review` | `status === 'review_ready' \| 'publishing'`, or failed while publishing | Full content |

### Key Features
- Copy title to clipboard button
- Source line under the keyword: seed (links to `/topic-candidates?seedId=`) › original candidate title, from the `topicCandidate` the detail endpoint joins in
- Error message display when `status === 'failed'`, titled Generation Error or Publish Error
- Amber alert with a Resolve button when an attempt is stuck (blocks republishing)
- "Publish requested" banner while an attempt waits for the worker
- Publish records section for every draft that has records, with status badges
- PublishModal for triggering publish job (shows the server's 409 message)

---

## PublishHistoryPage

**File**: `src/pages/PublishHistoryPage.tsx`
**Route**: `/publish-history`

### Purpose
View and manage article publish records (audit log of Tistory publishing events).

### API Calls
- `publishRecordsApi.getList(params)` — paginated list
- `publishRecordsApi.create(payload)` — create record manually
- `publishRecordsApi.update(id, payload)` — edit record
- `publishRecordsApi.remove(id)` — delete record

### State
- `formTarget` (`undefined` = closed, `null` = create, `PublishRecord` = edit)
- `deleteTarget` (`null` = closed, `PublishRecord` = confirm delete)
- `page` — current pagination page
- `statusFilter` — the API cannot filter by status, so a filtered view loads the latest 100 records and filters them client-side (pagination hidden)
- `resolveTarget` — stuck attempt open in `ResolveAttemptDialog`

### Key Features
- Combobox draft selector with search in create mode (Headless UI Combobox)
- Schedule mode: `none` / `now` / `schedule` (with datetime picker)
- Protocol-stripped URL display for permalinks
- Status column (`PublishRecordStatusBadge`) and a Resolve action on stuck attempts
- Pagination (limit=20)

---

## ApiSourcePage

**File**: `src/pages/ApiSourcePage.tsx`
**Route**: `/api-sources`

### Purpose
Simple CRUD for external API source references (e.g., billing dashboards for OpenAI, Replicate, etc.).

### API Calls
- `apiSourceApi.getList()` — full list (no pagination)
- `apiSourceApi.create(body)` — create
- `apiSourceApi.update(id, body)` — update
- `apiSourceApi.delete(id)` — hard delete

### State
- `formTarget` (`undefined` = closed, `null` = create, `ApiSource` = edit)
- `deleteTarget` (`null` = closed, `ApiSource` = confirm delete)

### Key Features
- React Hook Form + inline validation
- Hover-reveal action buttons (edit, delete)
- Clickable URL links with ExternalLink icon
- Protocol-stripped URL display

---

## ThumbnailGeneratorPage

**File**: `src/pages/ThumbnailGeneratorPage.tsx`
**Route**: `/thumbnail-generator`

### Purpose
Generate custom AI thumbnails via Replicate. Manages prompt submission, status polling, image gallery, and history.

### API Calls
- `thumbnailGeneratorApi.generate(dto)` — create prompt + enqueue job
- `thumbnailGeneratorApi.getPrompt(id)` — poll status every 3s
- `thumbnailGeneratorApi.getImages(promptId)` — fetch images when done
- `thumbnailGeneratorApi.setActive(mappingId, active)` — toggle active flag
- `thumbnailGeneratorApi.deletePrompt(id)` — delete
- `thumbnailGeneratorApi.getPrompts(1, 30)` — history list

### State
- `isGenerating` — polling active
- `activePromptId` — which prompt's images are shown in gallery
- `viewImages` — current gallery `ThumbnailPromptMapping[]`
- `togglingId` — which mapping is being toggled (for loading state)
- `deletingId` — which prompt is being deleted
- `showOptions` — advanced options panel visibility
- Polling timeout ref (2 minute max)

### Polling Logic
Uses TanStack Query `refetchInterval` on `getPrompt`:
```typescript
enabled: !!activePromptId && isGenerating,
refetchInterval: isGenerating ? POLL_INTERVAL_MS : false,
```
Stops when `polledPrompt.status === 'done'` or `'failed'`.

### Form Fields
| Field | Default | Notes |
|-------|---------|-------|
| `prompt` | — | Required textarea |
| `name` | — | Optional label |
| `model` | `black-forest-labs/flux-schnell` | Select (schnell / dev) |
| `aspect_ratio` | `16:9` | Select |
| `output_format` | `webp` | Select (webp / jpg / png) |
| `num_outputs` | `1` | Number input (1–4) |
| `output_quality` | `85` | Number input (0–100) |

Model/aspect/format/num_outputs/quality are under "Advanced Options" collapse.
