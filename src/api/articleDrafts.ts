import axios from 'axios';
import type {
  ArticleDraft,
  ArticleDraftListParams,
  PaginatedArticleDrafts,
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
};
