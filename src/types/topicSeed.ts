export type TopicSeedCategory =
  | 'meaning'
  | 'difference'
  | 'example'
  | 'phrases'
  | 'grammar';

export interface TopicSeed {
  id: string;
  seed: string;
  normalizedSeed: string;
  category: TopicSeedCategory;
  priority: number;
  isActive: boolean;
  memo: string | null;
  usedCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicSeedListResponse {
  data: TopicSeed[];
  total: number;
  page: number;
  limit: number;
}

export interface TopicSeedListParams {
  page?: number;
  limit?: number;
  category?: TopicSeedCategory;
  isActive?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'priority' | 'usedCount';
  order?: 'asc' | 'desc';
}

export interface TopicSeedFormValues {
  seed: string;
  category: TopicSeedCategory;
  priority: number;
  isActive: boolean;
  memo: string;
}

export interface GenerateResponse {
  message: string;
  seedId: string;
}

export interface EvaluateResponse {
  message: string;
  seedId: string;
}
