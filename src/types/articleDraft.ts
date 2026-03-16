// ─── Status ──────────────────────────────────────────────────────────────────

export type ArticleDraftStatus =
  | 'queued'
  | 'generating_outline'
  | 'outline_generated'
  | 'generating_content'
  | 'content_generated'
  | 'generating_thumbnail'
  | 'review_ready'
  | 'failed';

// 파이프라인이 아직 진행 중인 상태 (polling 트리거)
export const IN_PROGRESS_STATUSES: ArticleDraftStatus[] = [
  'queued',
  'generating_outline',
  'outline_generated',
  'generating_content',
  'content_generated',
  'generating_thumbnail',
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

export interface ArticleDraftListParams {
  page?: number;
  limit?: number;
  status?: ArticleDraftStatus;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
}
