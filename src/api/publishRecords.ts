import axios from 'axios';
import type { PublishRecord, PublishRecordStatus } from '../types/articleDraft';

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
  /** Server defaults to "published": a hand-entered record documents a live post */
  status?: PublishRecordStatus;
  blogName?: string | null;
  permalink?: string | null;
  schedule?: { mode: 'now' } | { mode: 'schedule'; scheduledAt: string } | null;
  meta?: Record<string, unknown> | null;
}

export interface UpdatePublishRecordPayload {
  /** Setting "failed" on an attempting record is what unblocks republishing */
  status?: PublishRecordStatus;
  blogName?: string | null;
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
