import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { topicCandidateApi } from '../api/topicCandidate';
import { topicSeedApi } from '../api/topicSeed';
import type { TopicCandidateListParams } from '../types/topicCandidate';
import TopicCandidateTable from '../components/topic-candidate/TopicCandidateTable';
import TopicCandidateFilters from '../components/topic-candidate/TopicCandidateFilters';
import TopicSeedPagination from '../components/topic-seed/TopicSeedPagination';

type SortableColumn = 'createdAt' | 'score';

const INITIAL_PARAMS: TopicCandidateListParams = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
};

export default function TopicCandidatePage() {
  const [params, setParams] = useState<TopicCandidateListParams>(INITIAL_PARAMS);

  // ─── 데이터 패칭 ─────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['topic-candidates', params],
    queryFn: () => topicCandidateApi.getList(params),
    staleTime: 30_000,
  });

  // Seed 드롭다운용 목록 (필터에서 사용)
  const { data: seedsData } = useQuery({
    queryKey: ['topic-seeds-all'],
    queryFn: () => topicSeedApi.getList({ limit: 100, sortBy: 'createdAt', order: 'desc' }),
    staleTime: 60_000,
  });

  // ─── 핸들러 ──────────────────────────────────────────────────────────────────
  const handleFilterChange = (filters: Partial<TopicCandidateListParams>) => {
    setParams((prev) => ({ ...prev, ...filters, page: 1 }));
  };

  const handleSort = (sortBy: SortableColumn) => {
    setParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC',
    }));
  };

  const handlePageChange = (page: number, limit: number) => {
    setParams((prev) => ({ ...prev, page, limit }));
  };

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-[1440px] mx-auto px-8 py-8">
      {/* 페이지 타이틀 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Topic Candidates</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Generate 작업으로 생성된 블로그 포스트 후보 목록입니다
        </p>
      </div>

      {/* 필터 */}
      <TopicCandidateFilters
        params={params}
        seeds={seedsData?.data ?? []}
        onChange={handleFilterChange}
      />

      {/* 테이블 */}
      <TopicCandidateTable
        data={data?.data ?? []}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        params={params}
        onSort={handleSort}
        onRetry={refetch}
      />

      {/* 페이지네이션 */}
      <TopicSeedPagination
        total={data?.total ?? 0}
        page={params.page ?? 1}
        limit={params.limit ?? 20}
        onChange={handlePageChange}
      />
    </main>
  );
}
