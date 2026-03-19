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

// 파이프라인이 아직 진행 중인 상태 (polling 트리거)
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

export interface PublishRecord {
  id: string;
  draftId: string;
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
