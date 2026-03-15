import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { topicCandidateApi } from '../api/topicCandidate';
import { topicSeedApi } from '../api/topicSeed';
import type { TopicCandidateListParams } from '../types/topicCandidate';
import type { TopicSeedCategory } from '../types/topicSeed';
import TopicCandidateTable from '../components/topic-candidate/TopicCandidateTable';
import TopicCandidateFilters from '../components/topic-candidate/TopicCandidateFilters';
import TopicSeedPagination from '../components/topic-seed/TopicSeedPagination';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

type SortableColumn = 'createdAt' | 'score';

const CATEGORY_LABELS: Record<TopicSeedCategory, string> = {
  meaning: 'Meaning',
  difference: 'Difference',
  example: 'Example',
  phrases: 'Phrases',
  grammar: 'Grammar',
};

const CATEGORY_STYLES: Record<TopicSeedCategory, string> = {
  meaning: 'bg-blue-100 text-blue-700',
  difference: 'bg-purple-100 text-purple-700',
  example: 'bg-emerald-100 text-emerald-700',
  phrases: 'bg-orange-100 text-orange-700',
  grammar: 'bg-rose-100 text-rose-700',
};

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

export default function TopicCandidatePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL ?seedId 를 초기값으로 사용
  const [params, setParams] = useState<TopicCandidateListParams>(() => ({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    topicSeedId: searchParams.get('seedId') ?? undefined,
  }));

  // ─── 데이터 패칭 ─────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['topic-candidates', params],
    queryFn: () => topicCandidateApi.getList(params),
    staleTime: 30_000,
  });

  // Seed 드롭다운 + 컨텍스트 바용 목록
  const { data: seedsData } = useQuery({
    queryKey: ['topic-seeds-all'],
    queryFn: () => topicSeedApi.getList({ limit: 100, sortBy: 'createdAt', order: 'desc' }),
    staleTime: 60_000,
  });

  // 현재 선택된 seed 객체 (컨텍스트 바 표시용)
  const selectedSeed = params.topicSeedId
    ? (seedsData?.data ?? []).find((s) => s.id === params.topicSeedId)
    : undefined;

  // ─── 핸들러 ──────────────────────────────────────────────────────────────────
  const handleFilterChange = (filters: Partial<TopicCandidateListParams>) => {
    const next = { ...params, ...filters, page: 1 };
    setParams(next);

    // topicSeedId 변경 시 URL 동기화
    if ('topicSeedId' in filters) {
      if (filters.topicSeedId) {
        setSearchParams({ seedId: filters.topicSeedId }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  };

  const handleClearSeed = () => {
    handleFilterChange({ topicSeedId: undefined });
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
          Blog post candidates generated from Topic Seeds
        </p>
      </div>

      {/* Seed 컨텍스트 바 (seed 선택 시에만 표시) */}
      {params.topicSeedId && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-sm text-blue-400 font-medium shrink-0">Seed</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-semibold text-blue-900 truncate">
              {selectedSeed?.seed ?? params.topicSeedId}
            </span>
            {selectedSeed && (
              <>
                <span className="text-blue-200">·</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[selectedSeed.category]}`}
                >
                  {CATEGORY_LABELS[selectedSeed.category]}
                </span>
                <span className="text-blue-200">·</span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    selectedSeed.isActive ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedSeed.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {selectedSeed.isActive ? 'Active' : 'Inactive'}
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleClearSeed}
            className="p-1 text-blue-300 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors shrink-0"
            title="Clear seed filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
