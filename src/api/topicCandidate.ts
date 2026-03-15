import axios from 'axios';
import type {
  TopicCandidateListResponse,
  TopicCandidateListParams,
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
};
