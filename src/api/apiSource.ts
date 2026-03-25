import axios from 'axios';
import type { ApiSource, ApiSourceFormValues } from '../types/apiSource';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

export const apiSourceApi = {
  getList: async (): Promise<ApiSource[]> => {
    const { data } = await api.get<ApiSource[]>('/api-sources');
    return data;
  },

  getOne: async (id: string): Promise<ApiSource> => {
    const { data } = await api.get<ApiSource>(`/api-sources/${id}`);
    return data;
  },

  create: async (body: ApiSourceFormValues): Promise<ApiSource> => {
    const { data } = await api.post<ApiSource>('/api-sources', body);
    return data;
  },

  update: async (id: string, body: Partial<ApiSourceFormValues>): Promise<ApiSource> => {
    const { data } = await api.patch<ApiSource>(`/api-sources/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api-sources/${id}`);
  },
};
