import axios from 'axios';
import type { PublishRecord } from '../types/articleDraft';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

export interface PublishRecordListParams {
  page?: number;
  limit?: number;
}

export interface CreatePublishRecordPayload {
  draftId: string;
  permalink?: string | null;
  schedule?: { mode: 'now' } | { mode: 'schedule'; scheduledAt: string } | null;
  meta?: Record<string, unknown> | null;
}

export interface UpdatePublishRecordPayload {
  permalink?: string | null;
  schedule?: { mode: 'now' } | { mode: 'schedule'; scheduledAt: string } | null;
  meta?: Record<string, unknown> | null;
}

export const publishRecordsApi = {
  getList: async (
    params: PublishRecordListParams,
  ): Promise<{ data: PublishRecord[]; total: number; page: number; limit: number }> => {
    const { data } = await api.get<{
      data: PublishRecord[];
      total: number;
      page: number;
      limit: number;
    }>('/article-publish-records', { params });
    return data;
  },

  create: async (payload: CreatePublishRecordPayload): Promise<PublishRecord> => {
    const { data } = await api.post<PublishRecord>('/article-publish-records', payload);
    return data;
  },

  update: async (id: string, payload: UpdatePublishRecordPayload): Promise<PublishRecord> => {
    const { data } = await api.patch<PublishRecord>(
      `/article-publish-records/${id}`,
      payload,
    );
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/article-publish-records/${id}`);
  },
};
