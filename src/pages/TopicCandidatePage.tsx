import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Sparkles, Loader2, FlaskConical } from 'lucide-react';
import axios from 'axios';
import { topicCandidateApi } from '../api/topicCandidate';
import { topicSeedApi } from '../api/topicSeed';
import type { ApproveCandidateResponse, TopicCandidateListParams } from '../types/topicCandidate';
import type { TopicSeedCategory } from '../types/topicSeed';
import TopicCandidateTable from '../components/topic-candidate/TopicCandidateTable';
import TopicCandidateFilters from '../components/topic-candidate/TopicCandidateFilters';
import TopicSeedPagination from '../components/topic-seed/TopicSeedPagination';
import ToastContainer from '../components/Toast';
import { useToast } from '../hooks/useToast';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

type SortableColumn = NonNullable<TopicCandidateListParams['sortBy']>;

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
  const navigate = useNavigate();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const prevTotalRef = useRef<number>(0);
  // Latest updatedAt on screen when scoring started. Scoring rewrites every
  // pending candidate, so a row newer than this means the run has landed -
  // which also covers re-scoring candidates that already had a score.
  const scoreBaselineRef = useRef<number>(0);

  const generateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evaluateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The seed filter lives only in the URL: the nav, seed rows and draft pages
  // all link here, and the page stays mounted when one of them changes it
  const seedId = searchParams.get('seedId') ?? undefined;
  const [filters, setFilters] = useState<Omit<TopicCandidateListParams, 'topicSeedId'>>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const params: TopicCandidateListParams = { ...filters, topicSeedId: seedId };

  // ─── 데이터 패칭 ─────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['topic-candidates', params],
    queryFn: () => topicCandidateApi.getList(params),
    staleTime: 30_000,
    refetchInterval: isGenerating || isEvaluating ? POLL_INTERVAL_MS : false,
  });

  // New candidates appeared -> generation is done, but the server chains
  // scoring straight after it, so keep polling until the scores land too
  useEffect(() => {
    if (!isGenerating) return;
    const currentTotal = data?.total ?? 0;
    if (currentTotal > prevTotalRef.current) {
      const added = currentTotal - prevTotalRef.current;
      stopGeneratePolling();
      addToast(`${added} candidate${added > 1 ? 's' : ''} generated — scoring them now`, 'success');
      // Measured from the newest creation rather than the newest update: if
      // scoring already finished before this poll saw the new rows, their
      // scored updatedAt would otherwise become the baseline and never be beaten
      startScorePolling(latestTimestamp('createdAt'));
    }
  }, [data?.total, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scoring is done once rows have been rewritten and none on screen is left
  // pending without a score
  useEffect(() => {
    if (!isEvaluating || !data) return;
    const rescored = data.data.filter(
      (c) => Date.parse(c.updatedAt) > scoreBaselineRef.current,
    ).length;
    const unscored = data.data.filter(
      (c) => c.status === 'pending' && c.overallScore === null,
    ).length;
    if (rescored > 0 && unscored === 0) {
      stopEvaluatePolling();
      addToast(`Scoring complete — ${rescored} candidate${rescored > 1 ? 's' : ''} scored`, 'success');
    }
  }, [data?.data, isEvaluating]); // eslint-disable-line react-hooks/exhaustive-deps

  // A different seed starts on its first page, and polling for the previous
  // one stops - its completion checks are measured against that seed's rows
  const prevSeedIdRef = useRef(seedId);
  useEffect(() => {
    if (prevSeedIdRef.current === seedId) return;
    prevSeedIdRef.current = seedId;
    setFilters((prev) => ({ ...prev, page: 1 }));
    stopGeneratePolling();
    stopEvaluatePolling();
  }, [seedId]);

  // 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
      if (evaluateTimeoutRef.current) clearTimeout(evaluateTimeoutRef.current);
    };
  }, []);

  const stopGeneratePolling = () => {
    setIsGenerating(false);
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
      generateTimeoutRef.current = null;
    }
  };

  const latestTimestamp = (field: 'createdAt' | 'updatedAt') =>
    Math.max(0, ...(data?.data ?? []).map((c) => Date.parse(c[field])));

  const startScorePolling = (baseline = latestTimestamp('updatedAt')) => {
    scoreBaselineRef.current = baseline;
    setIsEvaluating(true);

    if (evaluateTimeoutRef.current) clearTimeout(evaluateTimeoutRef.current);
    evaluateTimeoutRef.current = setTimeout(() => {
      setIsEvaluating(false);
      addToast('Scoring is taking longer than expected. Please refresh manually.', 'error');
    }, POLL_TIMEOUT_MS);
  };

  const stopEvaluatePolling = () => {
    setIsEvaluating(false);
    if (evaluateTimeoutRef.current) {
      clearTimeout(evaluateTimeoutRef.current);
      evaluateTimeoutRef.current = null;
    }
  };

  // Every seed, for the dropdown and for naming each row's seed when the list
  // spans them all. One page would stop at the API's 100-seed limit.
  const { data: seeds = [] } = useQuery({
    queryKey: ['topic-seeds', 'all'],
    queryFn: topicSeedApi.getAll,
    staleTime: 60_000,
  });

  // The selected seed is fetched on its own, so the context bar and Generate
  // never depend on it having made it into the list above
  const { data: selectedSeed, isError: isSeedError } = useQuery({
    queryKey: ['topic-seeds', params.topicSeedId],
    queryFn: () => topicSeedApi.getOne(params.topicSeedId!),
    enabled: !!params.topicSeedId,
    staleTime: 30_000,
  });

  const generateBlockedReason = !selectedSeed
    ? (isSeedError ? 'Seed not found' : 'Loading seed…')
    : !selectedSeed.isActive
      ? 'Cannot generate for inactive seeds'
      : null;

  // Rows from every seed need to say whose they are
  const seedNames = params.topicSeedId
    ? undefined
    : new Map(seeds.map((s) => [s.id, s.seed]));

  // ─── Generate mutation ───────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: (seedId: string) => topicSeedApi.generate(seedId),
    onSuccess: () => {
      prevTotalRef.current = data?.total ?? 0;
      setIsGenerating(true);

      generateTimeoutRef.current = setTimeout(() => {
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

  // ─── Evaluate mutation ───────────────────────────────────────────────────────
  const evaluateMutation = useMutation({
    mutationFn: (seedId: string) => topicSeedApi.evaluate(seedId),
    onSuccess: () => {
      startScorePolling();
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error)
          ? (error.response?.data?.message ?? 'Failed to queue evaluate job.')
          : 'Failed to queue evaluate job.';
      addToast(message, 'error');
    },
  });

  const isBusy = isGenerating || isEvaluating || generateMutation.isPending || evaluateMutation.isPending;

  // ─── 핸들러 ──────────────────────────────────────────────────────────────────
  const handleFilterChange = (changes: Partial<TopicCandidateListParams>) => {
    const { topicSeedId, ...rest } = changes;
    setFilters((prev) => ({ ...prev, ...rest, page: 1 }));

    if ('topicSeedId' in changes) {
      setSearchParams(topicSeedId ? { seedId: topicSeedId } : {}, { replace: true });
    }
  };

  const handleClearSeed = () => {
    handleFilterChange({ topicSeedId: undefined });
  };

  const handleSort = (sortBy: SortableColumn) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC',
    }));
  };

  const handleApproved = (result: ApproveCandidateResponse) => {
    const openDraft = {
      label: 'Open draft',
      onClick: () => navigate(`/article-drafts/${result.articleDraftId}`),
    };
    if (result.pipelineQueued) {
      addToast('Approved — article generation started', 'success', openDraft);
    } else {
      // Re-approving never restarts a draft that got past "failed"
      addToast('Approved — this candidate already has a draft', 'success', openDraft);
    }
  };

  const handlePageChange = (page: number, limit: number) => {
    setFilters((prev) => ({ ...prev, page, limit }));
  };

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        {/* 페이지 타이틀 */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Topic Candidates</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Blog post candidates generated from Topic Seeds
            </p>
          </div>

          {/* Generate / Evaluate 버튼 — seed 선택 시에만 표시 */}
          {params.topicSeedId && (
            <div className="flex items-center gap-2">
              {/* Generate */}
              <button
                onClick={() => generateMutation.mutate(params.topicSeedId!)}
                disabled={isBusy || generateBlockedReason !== null}
                title={generateBlockedReason ?? 'Generate candidates'}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm ${
                  generateBlockedReason === null && !isBusy
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

              {/* Re-score - scoring already runs after every Generate */}
              <button
                onClick={() => evaluateMutation.mutate(params.topicSeedId!)}
                disabled={isBusy}
                title="Re-score pending candidates. Generate scores new candidates automatically."
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm ${
                  !isBusy
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isEvaluating || evaluateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FlaskConical className="w-4 h-4" />
                )}
                {isEvaluating ? 'Scoring...' : 'Re-score'}
              </button>
            </div>
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
              onClick={stopGeneratePolling}
              className="ml-auto p-1 text-violet-300 hover:text-violet-600 hover:bg-violet-100 rounded-md transition-colors shrink-0"
              title="Cancel polling"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 평가 중 배너 */}
        {isEvaluating && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 mb-4">
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              Scoring candidates — polling every 3 seconds…
            </p>
            <button
              onClick={stopEvaluatePolling}
              className="ml-auto p-1 text-emerald-300 hover:text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors shrink-0"
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 flex-1 min-w-0">
              <span className="font-semibold text-blue-900 truncate">
                {selectedSeed?.seed ?? (isSeedError ? params.topicSeedId : '…')}
              </span>
              {selectedSeed && (
                <>
                  <span className="hidden sm:inline text-blue-200">·</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[selectedSeed.category]}`}
                  >
                    {CATEGORY_LABELS[selectedSeed.category]}
                  </span>
                  <span className="hidden sm:inline text-blue-200">·</span>
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
          seeds={seeds}
          onChange={handleFilterChange}
        />

        {/* 테이블 */}
        <TopicCandidateTable
          data={data?.data ?? []}
          seedNames={seedNames}
          isLoading={isLoading}
          isFetching={isFetching || isGenerating || isEvaluating}
          isError={isError}
          params={params}
          onSort={handleSort}
          onRetry={refetch}
          onApproved={handleApproved}
          onApproveError={(message) => addToast(message, 'error')}
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
