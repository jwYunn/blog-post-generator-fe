export type TopicCandidateStatus = 'pending' | 'approved' | 'rejected';

export interface EvaluationDetail {
  search_demand: number;
  search_intent_clarity: number;
  topic_specificity: number;
  seo_title_quality: number;
  practical_value: number;
  outline_feasibility: number;
  uniqueness: number;
}

export interface TopicCandidate {
  id: string;
  topicSeedId: string;
  title: string;
  keyword: string;
  score: number;
  status: TopicCandidateStatus;
  searchIntent: string | null;
  targetReader: string | null;
  whyThisTopic: string | null;
  outlinePreview: string[] | null;
  // Postgres decimal column - arrives as a string such as "85.50"
  overallScore: string | null;
  rank: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  verdict: 'keep' | 'consider' | 'drop' | null;
  evaluationDetail: EvaluationDetail | null;
  /** The draft this candidate's approval made - set on list endpoints only */
  articleDraftId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicCandidateListResponse {
  data: TopicCandidate[];
  total: number;
  page: number;
  limit: number;
}

export type UpdateCandidateStatus = 'approved' | 'rejected';

export interface UpdateTopicCandidateStatusRequest {
  status: UpdateCandidateStatus;
}

export interface ApproveCandidateResponse {
  id: string;
  status: 'approved';
  /** The draft this candidate became - newly created or the one it already had */
  articleDraftId: string;
  articleDraftCreated: boolean;
  /** False when an existing draft was left alone, so no generation is running */
  pipelineQueued: boolean;
}

export interface RejectCandidateResponse {
  id: string;
  status: 'rejected';
}

export type UpdateTopicCandidateStatusResponse =
  | ApproveCandidateResponse
  | RejectCandidateResponse;

export interface TopicCandidateListParams {
  page?: number;
  limit?: number;
  topicSeedId?: string;
  status?: TopicCandidateStatus;
  keyword?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'createdAt' | 'score' | 'title' | 'overallScore' | 'rank';
  sortOrder?: 'ASC' | 'DESC';
}

// ─── Seed 상세 페이지용 ────────────────────────────────────────────────────────

export interface PaginatedCandidates {
  data: TopicCandidate[];
  total: number;
  page: number;
  limit: number;
}

export interface CandidateListQuery {
  page?: number;
  limit?: number;
  status?: TopicCandidateStatus;
  keyword?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'createdAt' | 'score' | 'title' | 'overallScore' | 'rank';
  sortOrder?: 'ASC' | 'DESC';
}
