import axios from 'axios';
import type {
  TopicCandidateListResponse,
  TopicCandidateListParams,
  UpdateTopicCandidateStatusRequest,
  UpdateTopicCandidateStatusResponse,
  PaginatedCandidates,
  CandidateListQuery,
} from '../types/topicCandidate';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

export const topicCandidateApi = {
  getList: async (params: TopicCandidateListParams): Promise<TopicCandidateListResponse> => {
    const { data } = await api.get<TopicCandidateListResponse>('/topic-candidates', { params });
    return data;
  },

  updateStatus: async (
    id: string,
    body: UpdateTopicCandidateStatusRequest,
  ): Promise<UpdateTopicCandidateStatusResponse> => {
    const { data } = await api.patch<UpdateTopicCandidateStatusResponse>(
      `/topic-candidates/${id}/status`,
      body,
    );
    return data;
  },

  fetchSeedCandidates: async (
    seedId: string,
    query: CandidateListQuery,
  ): Promise<PaginatedCandidates> => {
    const { data } = await api.get<PaginatedCandidates>(
      `/topic-seeds/${seedId}/candidates`,
      { params: query },
    );
    return data;
  },
};
