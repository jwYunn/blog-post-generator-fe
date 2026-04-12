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
Generate and evaluate topic candidates for a selected seed. Polling-based UI for async job status.

### API Calls
- `topicCandidateApi.getList(params)` — candidate list (polled)
- `topicSeedApi.getOne(seedId)` — fetch seed context for header
- `topicSeedApi.generate(seedId)` — enqueue generation job
- `topicSeedApi.evaluate(seedId)` — enqueue evaluation job

### State
- `seedId` from `useSearchParams` (`?seedId=`)
- `isGenerating` / `isEvaluating` — polling active flags
- `prevTotalRef` — ref to previous candidate count (generation completion detection)
- `prevEvaluatedCountRef` — ref to previous evaluated count (evaluation completion detection)
- Polling timeout refs: auto-cancel after 2 minutes

### Polling Logic
**Generation**: Polls candidate list every 3s. Stops when `data.total` increases compared to `prevTotalRef`.

**Evaluation**: Polls every 3s. Stops when the count of candidates where `overallScore !== null` increases.

### Key Features
- Seed context bar at top (category badge, priority, active status)
- Generate and Evaluate buttons side by side
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
Automatically stops polling once all drafts reach a terminal state.

### Key Features
- Status filter dropdown
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
- `articleDraftApi.getOne(id)` — polled every 3s while in-progress
- `articleDraftApi.getPublishRecords(draftId)` — only fetched when `status === 'published'`

### State
- `selectedStep` — which pipeline step the user is viewing (`'outline' | 'content' | 'thumbnail' | 'review' | null`)
- `publishModalOpen` — controls PublishModal visibility
- Auto-advances `selectedStep` to the latest available step on data change

### Pipeline Steps
| Step key | Requires | Shows |
|----------|----------|-------|
| `outline` | `draft.outline !== null` | `ArticleDraftOutlineSection` |
| `content` | `draft.content !== null` | `ArticleDraftContentSection` |
| `thumbnail` | `draft.thumbnailImageUrl !== null` | Thumbnail image preview |
| `review` | `status === 'review_ready' \| 'published'` | Full content + publish button |

### Key Features
- Copy title to clipboard button
- Error message display when `status === 'failed'`
- Publish records section (when published)
- PublishModal for triggering publish job

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

### Key Features
- Combobox draft selector with search in create mode (Headless UI Combobox)
- Schedule mode: `none` / `now` / `schedule` (with datetime picker)
- Protocol-stripped URL display for permalinks
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
