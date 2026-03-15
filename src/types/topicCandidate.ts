export type TopicCandidateStatus = 'pending' | 'approved' | 'rejected';

export interface TopicCandidate {
  id: string;
  topicSeedId: string;
  title: string;
  keyword: string;
  score: number;
  status: TopicCandidateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TopicCandidateListResponse {
  data: TopicCandidate[];
  total: number;
  page: number;
  limit: number;
}

export interface TopicCandidateListParams {
  page?: number;
  limit?: number;
  topicSeedId?: string;
  status?: TopicCandidateStatus;
  keyword?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'createdAt' | 'score';
  sortOrder?: 'ASC' | 'DESC';
}
