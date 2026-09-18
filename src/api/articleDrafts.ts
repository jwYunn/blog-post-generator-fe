import axios from 'axios';
import type {
  ArticleDraft,
  ArticleDraftListParams,
  PaginatedArticleDrafts,
  CreatePublishJobDto,
  PublishJobResponse,
  PublishRecord,
} from '../types/articleDraft';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

export const articleDraftApi = {
  getList: async (params: ArticleDraftListParams): Promise<PaginatedArticleDrafts> => {
    const { data } = await api.get<PaginatedArticleDrafts>('/article-drafts', { params });
    return data;
  },

  getOne: async (id: string): Promise<ArticleDraft> => {
    const { data } = await api.get<ArticleDraft>(`/article-drafts/${id}`);
    return data;
  },

  publishDraft: async (
    id: string,
    dto: CreatePublishJobDto,
  ): Promise<PublishJobResponse> => {
    const { data } = await api.post<PublishJobResponse>(
      `/article-drafts/${id}/publish`,
      dto,
    );
    return data;
  },

  getPublishRecords: async (
    draftId: string,
  ): Promise<{ data: PublishRecord[]; total: number; page: number; limit: number }> => {
    const { data } = await api.get<{
      data: PublishRecord[];
      total: number;
      page: number;
      limit: number;
    }>(`/article-drafts/${draftId}/publish-records`);
    return data;
  },
};
