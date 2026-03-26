import axios from 'axios';
import type {
  ThumbnailPrompt,
  ThumbnailPromptMapping,
  ThumbnailPromptListResponse,
  GenerateThumbnailRequest,
} from '../types/thumbnail';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

export const thumbnailGeneratorApi = {
  generate: async (dto: GenerateThumbnailRequest): Promise<ThumbnailPrompt> => {
    const { data } = await api.post<ThumbnailPrompt>('/thumbnail-generator/generate', dto);
    return data;
  },

  getPrompts: async (page = 1, limit = 20): Promise<ThumbnailPromptListResponse> => {
    const { data } = await api.get<ThumbnailPromptListResponse>('/thumbnail-generator/prompts', {
      params: { page, limit },
    });
    return data;
  },

  getPrompt: async (id: string): Promise<ThumbnailPrompt> => {
    const { data } = await api.get<ThumbnailPrompt>(`/thumbnail-generator/prompts/${id}`);
    return data;
  },

  getImages: async (promptId: string): Promise<ThumbnailPromptMapping[]> => {
    const { data } = await api.get<ThumbnailPromptMapping[]>(
      `/thumbnail-generator/prompts/${promptId}/images`,
    );
    return data;
  },

  setActive: async (mappingId: string, active: boolean): Promise<ThumbnailPromptMapping> => {
    const { data } = await api.patch<ThumbnailPromptMapping>(
      `/thumbnail-generator/mappings/${mappingId}/active`,
      { active },
    );
    return data;
  },

  deletePrompt: async (id: string): Promise<void> => {
    await api.delete(`/thumbnail-generator/prompts/${id}`);
  },
};
