import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';
import { topicCandidateApi } from '../api/topicCandidate';
import { topicSeedApi } from '../api/topicSeed';
import type { TopicCandidateListParams } from '../types/topicCandidate';
import type { TopicSeedCategory } from '../types/topicSeed';
import TopicCandidateTable from '../components/topic-candidate/TopicCandidateTable';
import TopicCandidateFilters from '../components/topic-candidate/TopicCandidateFilters';
import TopicSeedPagination from '../components/topic-seed/TopicSeedPagination';
import ToastContainer from '../components/Toast';
import { useToast } from '../hooks/useToast';

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

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 120_000; // 2분 후 자동 중단

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

export default function TopicCandidatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const prevTotalRef = useRef<number>(0);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    refetchInterval: isGenerating ? POLL_INTERVAL_MS : false,
  });

  // 새 후보 감지 → 폴링 중단
  useEffect(() => {
    if (!isGenerating) return;
    const currentTotal = data?.total ?? 0;
    if (currentTotal > prevTotalRef.current) {
      const added = currentTotal - prevTotalRef.current;
      stopPolling();
      addToast(`${added} candidate${added > 1 ? 's' : ''} generated!`, 'success');
    }
  }, [data?.total, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const stopPolling = () => {
    setIsGenerating(false);
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  // Seed 드롭다운 + 컨텍스트 바용 목록
  const { data: seedsData } = useQuery({
    queryKey: ['topic-seeds-all'],
    queryFn: () => topicSeedApi.getList({ limit: 100, sortBy: 'createdAt', order: 'desc' }),
    staleTime: 60_000,
  });

  // 현재 선택된 seed 객체
  const selectedSeed = params.topicSeedId
    ? (seedsData?.data ?? []).find((s) => s.id === params.topicSeedId)
    : undefined;

  // ─── Generate mutation ───────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: (seedId: string) => topicSeedApi.generate(seedId),
    onSuccess: () => {
      prevTotalRef.current = data?.total ?? 0;
      setIsGenerating(true);

      // 2분 후 타임아웃 안전장치
      pollTimeoutRef.current = setTimeout(() => {
        setIsGenerating(false);
        addToast('Generation is taking longer than expected. Please refresh manually.', 'error');
      }, POLL_TIMEOUT_MS);
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error)
          ? (error.response?.data?.message ?? 'Failed to queue generate job.')
          : 'Failed to queue generate job.';
      addToast(message, 'error');
    },
  });

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
    <>
      <main className="max-w-[1440px] mx-auto px-8 py-8">
        {/* 페이지 타이틀 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Topic Candidates</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Blog post candidates generated from Topic Seeds
            </p>
          </div>

          {/* Generate 버튼 — seed 선택 시에만 표시 */}
          {params.topicSeedId && (
            <button
              onClick={() => generateMutation.mutate(params.topicSeedId!)}
              disabled={isGenerating || generateMutation.isPending || !selectedSeed?.isActive}
              title={!selectedSeed?.isActive ? 'Cannot generate for inactive seeds' : 'Generate candidates'}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm ${
                selectedSeed?.isActive && !isGenerating && !generateMutation.isPending
                  ? 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating || generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>

        {/* 생성 중 배너 */}
        {isGenerating && (
          <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5 mb-4">
            <Loader2 className="w-4 h-4 text-violet-500 animate-spin shrink-0" />
            <p className="text-sm text-violet-700 font-medium">
              Generating candidates with AI — polling every 3 seconds…
            </p>
            <button
              onClick={stopPolling}
              className="ml-auto p-1 text-violet-300 hover:text-violet-600 hover:bg-violet-100 rounded-md transition-colors shrink-0"
              title="Cancel polling"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
          isFetching={isFetching || isGenerating}
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
