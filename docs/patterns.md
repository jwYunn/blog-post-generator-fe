# Patterns

Recurring implementation patterns used across the app. Follow these when adding new features.

---

## Polling Pattern

Used for async backend jobs that take time to complete. There are two variants:

### Variant A — Change Detection Polling (TopicCandidatePage)

Used when there's no explicit "done" status on the primary list query. Detects completion by comparing a count before and after.

> TopicCandidatePage goes one step further: the server chains scoring after generation, so when the count rises it keeps polling as "scoring" until rows are rewritten after a timestamp baseline. See [Pages](pages.md#topiccandidatepage).

```typescript
const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 120_000

const [isGenerating, setIsGenerating] = useState(false)
const prevTotalRef = useRef<number>(0)
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

const { data } = useQuery({
  queryKey: ['topic-candidates', params],
  queryFn: () => topicCandidateApi.getList(params),
  refetchInterval: isGenerating ? POLL_INTERVAL_MS : false,
})

// Detect completion
useEffect(() => {
  if (!isGenerating || !data) return
  if (data.total > prevTotalRef.current) {
    stopPolling()  // new items appeared — job is done
  }
}, [data?.total])

const stopPolling = () => {
  setIsGenerating(false)
  if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
}

// Start polling
const handleGenerate = async () => {
  prevTotalRef.current = data?.total ?? 0
  await topicSeedApi.generate(seedId)
  setIsGenerating(true)
  timeoutRef.current = setTimeout(() => {
    setIsGenerating(false)
    addToast('Timed out.', 'error')
  }, POLL_TIMEOUT_MS)
}

// Cleanup on unmount
useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])
```

### Variant B — Status-Based Polling (ThumbnailGeneratorPage)

Used when a single resource has an explicit status field (`generating → done | failed`).

```typescript
const { data: polledPrompt } = useQuery({
  queryKey: ['thumbnail-prompt', activePromptId],
  queryFn: () => thumbnailGeneratorApi.getPrompt(activePromptId!),
  enabled: !!activePromptId && isGenerating,
  refetchInterval: isGenerating ? POLL_INTERVAL_MS : false,
})

useEffect(() => {
  if (!isGenerating || !polledPrompt) return
  if (polledPrompt.status === 'done') {
    stopPolling()
    loadImages(polledPrompt.id)
  } else if (polledPrompt.status === 'failed') {
    stopPolling()
    addToast('Generation failed.', 'error')
  }
}, [polledPrompt?.status])
```

### Variant C — Conditional Refetch (ArticleDraftListPage / DetailPage)

Used for lists where any item being in-progress should trigger polling. No manual start/stop needed.

```typescript
const { data } = useQuery({
  queryKey: ['article-drafts', params],
  queryFn: () => articleDraftApi.getList(params),
  refetchInterval: (query) => {
    const drafts = query.state.data?.data ?? []
    return drafts.some(d => IN_PROGRESS_STATUSES.includes(d.status))
      ? 3_000
      : false
  },
})
```

---

## Modal Pattern

All modals use Headless UI `Dialog`. State is managed in the parent page.

### State Convention

```typescript
// undefined = closed, null = create mode, T = edit mode
const [formTarget, setFormTarget] = useState<MyEntity | null | undefined>(undefined)

// Open create: setFormTarget(null)
// Open edit:   setFormTarget(entity)
// Close:       setFormTarget(undefined)
```

For delete confirmation:
```typescript
const [deleteTarget, setDeleteTarget] = useState<MyEntity | null>(null)
// null = closed, entity = open
```

### Modal Implementation

```typescript
function MyFormModal({ target, onClose }: { target: MyEntity | null; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: target ? { ...target } : defaultValues,
  })

  const mutation = useMutation({
    mutationFn: (values) => target ? api.update(target.id, values) : api.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource'] })
      addToast('Saved.', 'success')
      onClose()
    },
    onError: () => addToast('Failed.', 'error'),
  })

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          {/* header */}
          {/* form */}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// In page:
{formTarget !== undefined && (
  <MyFormModal target={formTarget} onClose={() => setFormTarget(undefined)} />
)}
```

---

## Form Pattern

React Hook Form + Zod for all forms.

```typescript
// 1. Define Zod schema
const schema = z.object({
  name: z.string().min(1, 'Required').max(100),
  url: z.string().url('Must be a valid URL'),
})
type FormValues = z.infer<typeof schema>

// 2. Initialize form
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', url: '' },
})

// 3. Submit handler
const onSubmit = (values: FormValues) => mutation.mutate(values)

// 4. JSX
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('name')} />
  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
  <button type="submit" disabled={isSubmitting || mutation.isPending}>Save</button>
</form>
```

---

## Toast Pattern

Use the `useToast()` hook. Every page instantiates its own toasts and renders `<ToastContainer />`.

```typescript
const { toasts, addToast, removeToast } = useToast()

// Show a toast
addToast('Created successfully.', 'success')
addToast('Something went wrong.', 'error')

// In JSX (at the bottom of the page fragment)
<ToastContainer toasts={toasts} onRemove={removeToast} />
```

Toasts auto-dismiss after 3.5 seconds. Pass an action as the third argument to offer a next step; those stay for 8 seconds:

```typescript
addToast('Approved — article generation started', 'success', {
  label: 'Open draft',
  onClick: () => navigate(`/article-drafts/${result.articleDraftId}`),
})
```

---

## Mutation Pattern

Standard TanStack Query mutation with cache invalidation and toast feedback.

```typescript
const queryClient = useQueryClient()
const { toasts, addToast, removeToast } = useToast()

const mutation = useMutation({
  mutationFn: (id: string) => api.delete(id),
  onMutate: (id) => setLoadingId(id),           // optional optimistic UI
  onSettled: () => setLoadingId(null),           // always cleanup loading state
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] })
    addToast('Deleted.', 'success')
  },
  onError: () => addToast('Failed to delete.', 'error'),
})
```

---

## Pagination Pattern

```typescript
const [page, setPage] = useState(1)
const [limit, setLimit] = useState(20)

const { data } = useQuery({
  queryKey: ['resource', { page, limit, ...otherParams }],
  queryFn: () => api.getList({ page, limit, ...otherParams }),
})

// Reset to page 1 when filters change
const handleFilterChange = (filters: Partial<Params>) => {
  setPage(1)
  setParams(prev => ({ ...prev, ...filters }))
}
```

Use `TopicSeedPagination` component for the UI — it handles ellipsis logic and per-page selector.

---

## Debounce Pattern

Used for search inputs to avoid firing requests on every keystroke.

```typescript
const [inputValue, setInputValue] = useState('')
const timerRef = useRef<ReturnType<typeof setTimeout>>()

const handleInputChange = (value: string) => {
  setInputValue(value)
  clearTimeout(timerRef.current)
  timerRef.current = setTimeout(() => {
    onChange({ search: value.trim() || undefined })
  }, 300)
}

// Cleanup
useEffect(() => () => clearTimeout(timerRef.current), [])
```

---

## Copy to Clipboard Pattern

```typescript
const [copied, setCopied] = useState(false)

const handleCopy = async (text: string) => {
  await navigator.clipboard.writeText(text)
  setCopied(true)
  setTimeout(() => setCopied(false), 1500)
}

// Button
<button onClick={() => handleCopy(text)}>
  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
</button>
```

---

## Responsive (Mobile) Pattern

The app is used from phones (e.g. publishing on the go), so every screen must fit a 375px viewport without horizontal page scroll. Write mobile-first: unprefixed classes target phones, `sm:` / `md:` add the desktop layout.

### Tables → card lists
Tables are desktop-only. Each list renders both views and lets the breakpoint pick one:

```tsx
{/* Mobile card list */}
<ul className="md:hidden divide-y divide-gray-50">
  {isLoading ? <SkeletonCard … /> : isError ? <ErrorState … /> : items.map((item) => <ItemCard … />)}
</ul>

{/* Desktop table */}
<div className="hidden md:block overflow-x-auto">
  <table>…</table>
</div>
```

- Badges, action buttons and empty/error states are small components shared by the table row and the card, so both stay in sync
- Sortable table headers are hidden on mobile — add a `md:hidden` "Sort" chip bar that calls the same `onSort`
- Row actions that only appear on hover must use `[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100` so touch devices always see them

### Layout rules
- Page wrappers use `px-4 sm:px-8` side padding
- Header rows with a title + button(s): add `gap-4` and `whitespace-nowrap flex-shrink-0` on the button, or `flex-wrap` when there are several buttons
- Any horizontal row that can outgrow 375px (filter chips, pagination, card headers) needs `flex-wrap` or `overflow-x-auto` — one overflowing element widens the whole page and pushes centered modals off-screen
- The top nav scrolls horizontally on narrow screens instead of wrapping
- Primary actions on a detail page get a `sm:hidden` sticky bottom bar (see the Publish bar in `ArticleDraftDetailPage`)
- Inputs are forced to 16px on touch devices in `src/index.css` to stop iOS Safari's focus zoom — no per-input handling needed

---

## Status Color Maps

Use these constants — don't hardcode Tailwind colors inline for status/verdict/category.

### CATEGORY_STYLES (TopicSeedCategory → Tailwind classes)
```typescript
const CATEGORY_STYLES: Record<TopicSeedCategory, string> = {
  meaning:    'bg-blue-100 text-blue-700',
  difference: 'bg-purple-100 text-purple-700',
  example:    'bg-emerald-100 text-emerald-700',
  phrases:    'bg-orange-100 text-orange-700',
  grammar:    'bg-rose-100 text-rose-700',
}
```

### VERDICT_STYLES (verdict → badge + dot classes)
```typescript
const VERDICT_STYLES = {
  keep:     { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  consider: { badge: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
  drop:     { badge: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
}
```

### STATUS_CONFIG (ArticleDraftStatus → label + colors)
Defined in `ArticleDraftStatusBadge.tsx`. Each status has `label`, `dotClass`, `bgClass`, `textClass`.
