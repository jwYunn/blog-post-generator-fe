# Components

All components live in `src/components/`. Pages own data fetching; components handle rendering and local interaction.

---

## Layout & Global

### Layout (`src/components/Layout.tsx`)
App shell rendered for all routes. Contains the top navigation bar and an `<Outlet />` for page content.

Navigation items are defined in the `NAV_ITEMS` array — add new tabs there.

---

### Toast (`src/components/Toast.tsx`)
Fixed-position toast container. Renders a stack of toast messages.

**Props**
```typescript
{
  toasts: ToastItem[]
  onRemove: (id: string) => void
}
```

Used in every page via the `useToast()` hook. See [Patterns](patterns.md) for usage.

---

## topic-seed/

### TopicSeedTable (`src/components/topic-seed/TopicSeedTable.tsx`)

8-column table rendering the seed list.

**Props**
```typescript
{
  data: TopicSeed[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  params: TopicSeedListParams
  onSort: (sortBy: 'createdAt' | 'priority' | 'usedCount') => void
  onEdit: (seed: TopicSeed) => void
  onDelete: (seed: TopicSeed) => void
  onRetry: () => void
}
```

Columns: Seed, Category, Priority, Status, Used Count, Last Used, Created, Actions

- Row click → navigates to `/topic-candidates?seedId=<id>`
- Sortable columns: `createdAt`, `priority`, `usedCount` (shows arrow icons)
- Actions (edit, delete) revealed on row hover

---

### TopicSeedFormModal (`src/components/topic-seed/TopicSeedFormModal.tsx`)

Create / Edit modal for seeds. Uses React Hook Form + Zod.

**Props**
```typescript
{
  open: boolean
  seed?: TopicSeed      // undefined = create mode
  onClose: () => void
  onSuccess: () => void
}
```

**Form fields**: seed (text), category (select), priority (number 1–10), isActive (toggle), memo (textarea)

**Zod schema constraints**: seed max 100 chars, memo max 500 chars, priority integer 1–10

Handles 409 conflict response for duplicate seeds with inline error message.

---

### TopicSeedFilters (`src/components/topic-seed/TopicSeedFilters.tsx`)

Filter bar above the seed table.

**Props**
```typescript
{
  params: TopicSeedListParams
  onChange: (filters: Partial<TopicSeedListParams>) => void
}
```

Controls: search input (300ms debounce), category dropdown, All / Active / Inactive toggle

---

### TopicSeedPagination (`src/components/topic-seed/TopicSeedPagination.tsx`)

Pagination bar with smart page number generation.

**Props**
```typescript
{
  total: number
  page: number
  limit: number
  onChange: (page: number, limit: number) => void
}
```

- Shows ellipsis when total pages > 7
- Per-page selector: 10, 20, 50, 100

---

### TopicSeedDeleteDialog (`src/components/topic-seed/TopicSeedDeleteDialog.tsx`)

Confirmation dialog before soft-deleting a seed.

**Props**
```typescript
{
  seed: TopicSeed
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}
```

---

## topic-candidate/

### TopicCandidateTable (`src/components/topic-candidate/TopicCandidateTable.tsx`)

Table of topic candidates with evaluation data, sorting, and approval action.

**Props**
```typescript
{
  data: TopicCandidate[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  params: TopicCandidateListParams
  onSort: (sortBy: 'overallScore' | 'rank' | 'createdAt') => void
  onRetry: () => void
}
```

Columns: Title, Keyword, Score, Rank, Verdict, Detail, Status, Approve

- **Detail** column: opens a modal showing `whyThisTopic`, `outlinePreview`, `searchIntent`, `targetReader`, `strengths`, `weaknesses`
- **Verdict** badge: `keep` (emerald), `consider` (amber), `drop` (red)
- **Approve** button: visible only for `pending` candidates; triggers `PATCH /topic-candidates/:id/status`
- Score and Rank columns are sortable

---

### TopicCandidateFilters (`src/components/topic-candidate/TopicCandidateFilters.tsx`)

**Props**
```typescript
{
  params: TopicCandidateListParams
  seeds: TopicSeed[]
  onChange: (filters: Partial<TopicCandidateListParams>) => void
}
```

Controls: seed selector dropdown, status toggle (All / Pending / Approved / Rejected)

---

### CandidateStatusActions (`src/components/topic-candidate/CandidateStatusActions.tsx`)

> **Note**: This component is currently unused. Approve/reject logic is inlined in `TopicCandidateTable`.

---

## article-draft/

### ArticleDraftStatusBadge (`src/components/article-draft/ArticleDraftStatusBadge.tsx`)

Colored badge displaying draft status. Shows animated spinner for in-progress states.

**Props**
```typescript
{
  status: ArticleDraftStatus
  size?: 'sm' | 'md'  // default 'md'
}
```

All 10 statuses have distinct colors defined in `STATUS_CONFIG`.

---

### ArticleDraftPipeline (`src/components/article-draft/ArticleDraftPipeline.tsx`)

Interactive horizontal pipeline showing 4 steps: Outline → Content → Thumbnail → Review.

**Props**
```typescript
{
  status: ArticleDraftStatus
  selectedStep: StepKey | null
  availableSteps: StepKey[]
  onSelectStep: (step: StepKey) => void
}
```

- Steps are clickable only when in `availableSteps`
- Connectors animate based on step completion
- Active step is highlighted

---

### ArticleDraftOutlineSection (`src/components/article-draft/ArticleDraftOutlineSection.tsx`)

Displays the generated article outline.

**Props**
```typescript
{
  outline: ArticleOutline
}
```

Shows: search intent chip, 3 numbered sections, 1–2 FAQ items in Q&A format.

---

### ArticleDraftContentSection (`src/components/article-draft/ArticleDraftContentSection.tsx`)

Content viewer with view mode toggle.

**Props**
```typescript
{
  content: string
  label?: string                    // 'Content' | 'Review'
  showCopy?: boolean                // shows copy button in Review step
  thumbnailImageUrl?: string | null // shown in Review step
}
```

**View modes**:
- `Preview` — rendered via `react-markdown`
- `Markdown` — raw markdown text
- `HTML` — converted HTML (uses `marked`, computed via `useMemo`)

The Review step (when `showCopy=true`) renders a copy button that copies the full content as Markdown, optionally with the thumbnail image embedded as `![thumbnail](url)`.

---

### HashtagsSection (`src/components/article-draft/HashtagsSection.tsx`)

**Props**
```typescript
{
  hashtags: string[] | null
}
```

Renders hashtag pills. Each pill has an individual copy button. "Copy All" copies all hashtags tab-separated.

---

### PublishModal (`src/components/article-draft/PublishModal.tsx`)

Modal for triggering article publishing to Tistory.

**Props**
```typescript
{
  open: boolean
  draftId: string
  draftTitle: string
  onClose: () => void
  onSuccess: () => void
}
```

**Modes**: Publish Now / Schedule (datetime-local picker, min 1 minute from now)

Calls `articleDraftApi.publishDraft(draftId, { mode, scheduledAt? })`.

---

### PublishRecordFormModal (`src/components/article-draft/PublishRecordFormModal.tsx`)

Create / Edit modal for publish records (used in PublishHistoryPage).

**Props**
```typescript
{
  open: boolean
  record?: PublishRecord    // undefined = create mode
  defaultDraftId?: string
  onClose: () => void
  onSuccess: () => void
}
```

**Create mode**: Shows Headless UI Combobox to search and select a draft.

**Fields**: draftId (combobox, create only), permalink (URL), scheduleMode (none/now/schedule), scheduledAt (datetime, conditional)

**Zod validation**: Requires `scheduledAt` when `scheduleMode === 'schedule'`.
