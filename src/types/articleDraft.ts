// ─── Status ──────────────────────────────────────────────────────────────────

export type ArticleDraftStatus =
  | 'queued'
  | 'generating_outline'
  | 'outline_generated'
  | 'generating_content'
  | 'content_generated'
  | 'generating_thumbnail'
  | 'review_ready'
  | 'publishing'
  | 'published'
  | 'failed';

// Pipeline is still in progress (triggers polling)
export const IN_PROGRESS_STATUSES: ArticleDraftStatus[] = [
  'queued',
  'generating_outline',
  'outline_generated',
  'generating_content',
  'content_generated',
  'generating_thumbnail',
  'publishing',
];

// ─── Outline ─────────────────────────────────────────────────────────────────

export interface ArticleOutline {
  title: string;
  keyword: string;
  searchIntent: string;
  sections: string[];
  faqs: string[];
}

// ─── Draft ───────────────────────────────────────────────────────────────────

export interface ArticleDraft {
  id: string;
  topicCandidateId: string;
  title: string;
  keyword: string;
  status: ArticleDraftStatus;
  outline: ArticleOutline | null;
  content: string | null;
  thumbnailImageUrl: string | null;
  hashtags: string[] | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── List ────────────────────────────────────────────────────────────────────

export interface PaginatedArticleDrafts {
  data: ArticleDraft[];
  total: number;
  page: number;
  limit: number;
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export type PublishJobMode = 'now' | 'schedule';

export interface CreatePublishJobDto {
  mode: PublishJobMode;
  scheduledAt?: string;
}

export interface PublishJobResponse {
  jobId: string;
  /** Written as "attempting" before the job is queued */
  publishRecordId: string;
}

/**
 * Outcome of one publish attempt.
 * - attempting: started, outcome unknown - a post may already be live.
 *   Blocks republishing until someone checks the blog and resolves it.
 * - published: the post went up. Also blocks republishing.
 * - failed: stopped before anything was posted, so a retry is safe.
 */
export type PublishRecordStatus = 'attempting' | 'published' | 'failed';

export interface PublishRecord {
  id: string;
  draftId: string;
  /** Joined on list endpoints only */
  draft?: ArticleDraft;
  status: PublishRecordStatus;
  blogName: string | null;
  permalink: string | null;
  schedule: { mode: 'now' } | { mode: 'schedule'; scheduledAt: string } | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface ArticleDraftListParams {
  page?: number;
  limit?: number;
  status?: ArticleDraftStatus;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
}
