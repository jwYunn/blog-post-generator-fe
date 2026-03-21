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

export const topicSeedApi = {
  getList: async (params: TopicSeedListParams): Promise<TopicSeedListResponse> => {
    const { data } = await api.get<TopicSeedListResponse>('/topic-seeds', { params });
    return data;
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
