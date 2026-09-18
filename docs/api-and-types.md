# API Layer & TypeScript Types

## API Layer

All API calls are centralized in `src/api/`. Each file exports a single object with methods. Axios instance uses `VITE_API_BASE_URL` (default: `http://localhost:3000`).

---

### topicSeedApi (`src/api/topicSeed.ts`)

```typescript
topicSeedApi.getList(params: TopicSeedListParams): Promise<TopicSeedListResponse>
// GET /topic-seeds

topicSeedApi.getOne(id: string): Promise<TopicSeed>
// GET /topic-seeds/:id

topicSeedApi.create(body: TopicSeedFormValues): Promise<TopicSeed>
// POST /topic-seeds

topicSeedApi.update(id: string, body: Partial<TopicSeedFormValues>): Promise<TopicSeed>
// PATCH /topic-seeds/:id

topicSeedApi.delete(id: string): Promise<void>
// DELETE /topic-seeds/:id

topicSeedApi.generate(id: string): Promise<GenerateResponse>
// POST /topic-seeds/:id/generate

topicSeedApi.evaluate(id: string): Promise<EvaluateResponse>
// POST /topic-seeds/:id/evaluate
// Re-scoring only - the server chains an evaluation after every generate
```

---

### topicCandidateApi (`src/api/topicCandidate.ts`)

```typescript
topicCandidateApi.getList(params: TopicCandidateListParams): Promise<TopicCandidateListResponse>
// GET /topic-candidates

topicCandidateApi.updateStatus(id: string, body: UpdateTopicCandidateStatusRequest): Promise<UpdateTopicCandidateStatusResponse>
// PATCH /topic-candidates/:id/status - approve returns the draft it created or found

topicCandidateApi.fetchSeedCandidates(seedId: string, query: CandidateListQuery): Promise<PaginatedCandidates>
// GET /topic-seeds/:seedId/candidates
```

---

### articleDraftApi (`src/api/articleDrafts.ts`)

```typescript
articleDraftApi.getList(params: ArticleDraftListParams): Promise<PaginatedArticleDrafts>
// GET /article-drafts

articleDraftApi.getOne(id: string): Promise<ArticleDraft>
// GET /article-drafts/:id

articleDraftApi.publishDraft(id: string, dto: CreatePublishJobDto): Promise<PublishJobResponse>
// POST /article-drafts/:id/publish - writes an "attempting" record before queueing;
// 409 while any earlier attempt is "attempting" or "published"

articleDraftApi.getPublishRecords(draftId: string): Promise<{ data: PublishRecord[]; total: number; page: number; limit: number }>
// GET /article-drafts/:draftId/publish-records
```

---

### publishRecordsApi (`src/api/publishRecords.ts`)

```typescript
publishRecordsApi.getList(params: PublishRecordListParams): Promise<{ data: PublishRecord[]; total: number; page: number; limit: number }>
// GET /article-publish-records

publishRecordsApi.create(payload: CreatePublishRecordPayload): Promise<PublishRecord>
// POST /article-publish-records

publishRecordsApi.update(id: string, payload: UpdatePublishRecordPayload): Promise<PublishRecord>
// PATCH /article-publish-records/:id - setting status "failed" on an attempt unblocks republishing

publishRecordsApi.remove(id: string): Promise<void>
// DELETE /article-publish-records/:id
```

---

### apiSourceApi (`src/api/apiSource.ts`)

```typescript
apiSourceApi.getList(): Promise<ApiSource[]>
// GET /api-sources

apiSourceApi.getOne(id: string): Promise<ApiSource>
// GET /api-sources/:id

apiSourceApi.create(body: ApiSourceFormValues): Promise<ApiSource>
// POST /api-sources

apiSourceApi.update(id: string, body: Partial<ApiSourceFormValues>): Promise<ApiSource>
// PATCH /api-sources/:id

apiSourceApi.delete(id: string): Promise<void>
// DELETE /api-sources/:id
```

---

### thumbnailGeneratorApi (`src/api/thumbnailGenerator.ts`)

```typescript
thumbnailGeneratorApi.generate(dto: GenerateThumbnailRequest): Promise<ThumbnailPrompt>
// POST /thumbnail-generator/generate

thumbnailGeneratorApi.getPrompts(page?: number, limit?: number): Promise<ThumbnailPromptListResponse>
// GET /thumbnail-generator/prompts

thumbnailGeneratorApi.getPrompt(id: string): Promise<ThumbnailPrompt>
// GET /thumbnail-generator/prompts/:id  ← used for status polling

thumbnailGeneratorApi.getImages(promptId: string): Promise<ThumbnailPromptMapping[]>
// GET /thumbnail-generator/prompts/:id/images

thumbnailGeneratorApi.setActive(mappingId: string, active: boolean): Promise<ThumbnailPromptMapping>
// PATCH /thumbnail-generator/mappings/:id/active

thumbnailGeneratorApi.deletePrompt(id: string): Promise<void>
// DELETE /thumbnail-generator/prompts/:id
```

---

## TypeScript Types

### src/types/topicSeed.ts

```typescript
type TopicSeedCategory = 'meaning' | 'difference' | 'example' | 'phrases' | 'grammar'

interface TopicSeed {
  id: string
  seed: string
  normalizedSeed: string
  category: TopicSeedCategory
  priority: number            // 1–10
  isActive: boolean
  memo: string | null
  usedCount: number
  lastUsedAt: string | null   // ISO datetime
  createdAt: string
  updatedAt: string
}

interface TopicSeedFormValues {
  seed: string
  category: TopicSeedCategory
  priority: number
  isActive: boolean
  memo: string
}

interface TopicSeedListParams {
  page?: number
  limit?: number
  category?: TopicSeedCategory
  isActive?: boolean
  search?: string
  sortBy?: 'createdAt' | 'priority' | 'usedCount'
  order?: 'ASC' | 'DESC'
}

interface TopicSeedListResponse {
  data: TopicSeed[]
  total: number
  page: number
  limit: number
}

interface GenerateResponse { message: string; seedId: string }
interface EvaluateResponse { message: string; seedId: string }
```

---

### src/types/topicCandidate.ts

```typescript
type TopicCandidateStatus = 'pending' | 'approved' | 'rejected'

interface EvaluationDetail {
  search_demand: number
  search_intent_clarity: number
  topic_specificity: number
  seo_title_quality: number
  practical_value: number
  outline_feasibility: number
  uniqueness: number
}

interface TopicCandidate {
  id: string
  topicSeedId: string
  title: string
  keyword: string
  score: number
  status: TopicCandidateStatus
  searchIntent: string | null
  targetReader: string | null
  whyThisTopic: string | null
  outlinePreview: string[] | null
  overallScore: string | null       // Postgres decimal, arrives as a string e.g. "85.50"
  rank: number | null
  strengths: string[] | null
  weaknesses: string[] | null
  verdict: 'keep' | 'consider' | 'drop' | null
  evaluationDetail: EvaluationDetail | null
  createdAt: string
  updatedAt: string
}

interface TopicCandidateListParams {
  page?: number
  limit?: number
  seedId?: string
  status?: TopicCandidateStatus
  keyword?: string
  minScore?: number
  maxScore?: number
  sortBy?: 'createdAt' | 'score' | 'title' | 'overallScore' | 'rank'
  sortOrder?: 'ASC' | 'DESC'
}

interface TopicCandidateListResponse {
  data: TopicCandidate[]
  total: number
  page: number
  limit: number
}

interface UpdateTopicCandidateStatusRequest {
  status: 'approved' | 'rejected'
}

interface ApproveCandidateResponse {
  id: string
  status: 'approved'
  articleDraftId: string        // created, or the draft the candidate already had
  articleDraftCreated: boolean
  pipelineQueued: boolean       // false when an existing draft was left alone
}

interface RejectCandidateResponse { id: string; status: 'rejected' }

type UpdateTopicCandidateStatusResponse = ApproveCandidateResponse | RejectCandidateResponse
```

---

### src/types/articleDraft.ts

```typescript
type ArticleDraftStatus =
  | 'queued'
  | 'generating_outline'
  | 'outline_generated'
  | 'generating_content'
  | 'content_generated'
  | 'generating_thumbnail'
  | 'review_ready'
  | 'publishing'
  | 'published'
  | 'failed'

// Used to drive conditional polling — all non-terminal, non-ready statuses
const IN_PROGRESS_STATUSES: ArticleDraftStatus[] = [
  'queued',
  'generating_outline',
  'outline_generated',
  'generating_content',
  'content_generated',
  'generating_thumbnail',
  'publishing',
]

interface ArticleOutline {
  title: string
  keyword: string
  searchIntent: string
  sections: string[]    // exactly 3
  faqs: string[]        // 1–2
}

interface ArticleDraft {
  id: string
  topicCandidateId: string
  title: string
  keyword: string
  status: ArticleDraftStatus
  outline: ArticleOutline | null
  content: string | null
  thumbnailImageUrl: string | null
  hashtags: string[] | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

interface ArticleDraftListParams {
  page?: number
  limit?: number
  status?: ArticleDraftStatus
  sortBy?: 'createdAt' | 'updatedAt'
  order?: 'ASC' | 'DESC'
}

interface PaginatedArticleDrafts {
  data: ArticleDraft[]
  total: number
  page: number
  limit: number
}

type PublishJobMode = 'now' | 'schedule'

interface CreatePublishJobDto {
  mode: PublishJobMode
  scheduledAt?: string  // ISO 8601, required when mode='schedule'
}

interface PublishJobResponse { jobId: string; publishRecordId: string }

// attempting: outcome unknown, a post may be live - blocks republishing until a person resolves it
// published: blocks republishing | failed: nothing was posted, retry is safe
type PublishRecordStatus = 'attempting' | 'published' | 'failed'

interface PublishRecord {
  id: string
  draftId: string
  draft?: ArticleDraft          // joined on list endpoints only
  status: PublishRecordStatus
  blogName: string | null
  permalink: string | null
  schedule: { mode: 'now' } | { mode: 'schedule'; scheduledAt: string } | null
  meta: Record<string, unknown> | null
  createdAt: string
}

// True while the worker is still expected to settle an "attempting" record on
// its own. A failed draft updated after the attempt means the run is over and
// the attempt is stuck; an attempt newer than the draft is a queued retry.
function isAttemptInFlight(record, draft): boolean
```

---

### src/types/apiSource.ts

```typescript
interface ApiSource {
  id: string
  name: string
  url: string
  meta: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

interface ApiSourceFormValues {
  name: string
  url: string
}
```

---

### src/types/thumbnail.ts

```typescript
type ThumbnailPromptStatus = 'generating' | 'done' | 'failed'

interface ThumbnailPromptMeta {
  aspect_ratio?: string     // e.g. "16:9"
  output_format?: string    // "webp" | "jpg" | "png"
  output_quality?: number   // 0–100
  num_outputs?: number      // 1–4
  megapixels?: string
}

interface ThumbnailPrompt {
  id: string
  name: string | null
  prompt: string
  model: string
  meta: ThumbnailPromptMeta | null
  status: ThumbnailPromptStatus
  createdAt: string
  updatedAt: string
}

interface Thumbnail {
  id: string
  url: string             // S3 public URL
  mimeType: string | null
  width: number | null
  height: number | null
  createdAt: string
}

interface ThumbnailPromptMapping {
  id: string
  promptId: string
  thumbnailId: string
  rank: number | null
  active: boolean
  createdAt: string
  thumbnail: Thumbnail    // always included via join
}

interface GenerateThumbnailRequest {
  prompt: string
  name?: string
  model?: string
  aspect_ratio?: string
  output_format?: string
  num_outputs?: number
  output_quality?: number
}

interface ThumbnailPromptListResponse {
  data: ThumbnailPrompt[]
  total: number
  page: number
  limit: number
}
```
