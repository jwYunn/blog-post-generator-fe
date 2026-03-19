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
};
