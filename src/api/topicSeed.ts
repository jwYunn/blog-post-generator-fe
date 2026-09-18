import axios from 'axios';
import type {
  TopicSeed,
  TopicSeedListResponse,
  TopicSeedListParams,
  TopicSeedFormValues,
  GenerateResponse,
  EvaluateResponse,
} from '../types/topicSeed';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// The list endpoint refuses a larger page
const MAX_PAGE_LIMIT = 100;

export const topicSeedApi = {
  getList: async (params: TopicSeedListParams): Promise<TopicSeedListResponse> => {
    const { data } = await api.get<TopicSeedListResponse>('/topic-seeds', { params });
    return data;
  },

  /**
   * Every seed, newest first, for pickers and name lookups that cannot stop at
   * one page. Reads the first page for the total, then the rest in parallel.
   */
  getAll: async (): Promise<TopicSeed[]> => {
    const params: TopicSeedListParams = { limit: MAX_PAGE_LIMIT, sortBy: 'createdAt', order: 'desc' };
    const first = await topicSeedApi.getList({ ...params, page: 1 });
    const pageCount = Math.ceil(first.total / MAX_PAGE_LIMIT);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) =>
        topicSeedApi.getList({ ...params, page: i + 2 }),
      ),
    );
    return [first, ...rest].flatMap((page) => page.data);
  },

  create: async (
    body: Omit<TopicSeedFormValues, 'memo'> & { memo?: string },
  ): Promise<TopicSeed> => {
    const { data } = await api.post<TopicSeed>('/topic-seeds', body);
    return data;
  },

  update: async (
    id: string,
    body: Partial<TopicSeedFormValues> & { memo?: string | undefined },
  ): Promise<TopicSeed> => {
    const { data } = await api.patch<TopicSeed>(`/topic-seeds/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/topic-seeds/${id}`);
  },

  getOne: async (id: string): Promise<TopicSeed> => {
    const { data } = await api.get<TopicSeed>(`/topic-seeds/${id}`);
    return data;
  },

  generate: async (id: string): Promise<GenerateResponse> => {
    const { data } = await api.post<GenerateResponse>(`/topic-seeds/${id}/generate`);
    return data;
  },

  evaluate: async (id: string): Promise<EvaluateResponse> => {
    const { data } = await api.post<EvaluateResponse>(`/topic-seeds/${id}/evaluate`);
    return data;
  },
};
