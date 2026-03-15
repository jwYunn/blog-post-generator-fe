import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { articleDraftApi } from '../api/articleDrafts';
import { IN_PROGRESS_STATUSES } from '../types/articleDraft';
import type { ArticleDraft } from '../types/articleDraft';
import ArticleDraftStatusBadge from '../components/article-draft/ArticleDraftStatusBadge';
import ArticleDraftPipeline from '../components/article-draft/ArticleDraftPipeline';
import type { StepKey } from '../components/article-draft/ArticleDraftPipeline';
import ArticleDraftOutlineSection from '../components/article-draft/ArticleDraftOutlineSection';
import ArticleDraftContentSection from '../components/article-draft/ArticleDraftContentSection';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Thumbnail view (Thumbnail 단계 선택 시) ──────────────────────────────────

function ThumbnailView({ url }: { url: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <h2 className="text-sm font-semibold text-gray-800">Thumbnail</h2>
      </div>
      <div className="p-8 flex items-center justify-center bg-gray-50/50">
        <img
          src={url}
          alt="Article thumbnail"
          className="max-w-full max-h-96 rounded-xl shadow-sm object-contain"
        />
      </div>
    </div>
  );
}

// ─── In-progress placeholder ──────────────────────────────────────────────────

function GeneratingPlaceholder() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Generating…</p>
        <p className="text-xs text-gray-400">This page refreshes automatically every 3 seconds</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-8">
        <div className="flex items-start gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-200" />
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
              {i < 4 && <div className="flex-1 pt-2.5 mx-1"><div className="h-0.5 bg-gray-100" /></div>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-2">
        {[80, 65, 70, 55, 75].map((w, i) => (
          <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Step content renderer ────────────────────────────────────────────────────

function StepContent({
  draft,
  selectedStep,
  isInProgress,
}: {
  draft: ArticleDraft;
  selectedStep: StepKey | null;
  isInProgress: boolean;
}) {
  // 선택된 단계가 없으면 진행 중 스피너 또는 아무것도 표시 안 함
  if (!selectedStep) {
    return isInProgress ? <GeneratingPlaceholder /> : null;
  }

  switch (selectedStep) {
    case 'outline':
      return draft.outline ? (
        <ArticleDraftOutlineSection outline={draft.outline} />
      ) : (
        isInProgress ? <GeneratingPlaceholder /> : null
      );

    case 'content':
      return draft.content ? (
        // Content 단: 토글 O, Copy X
        <ArticleDraftContentSection
          content={draft.content}
          label="Content"
          showCopy={false}
        />
      ) : (
        isInProgress ? <GeneratingPlaceholder /> : null
      );

    case 'thumbnail':
      return draft.thumbnailImageUrl ? (
        <ThumbnailView url={draft.thumbnailImageUrl} />
      ) : (
        isInProgress ? <GeneratingPlaceholder /> : null
      );

    case 'review':
      // Review 단: 썸네일 + 마크다운, 토글 O, Copy O
      return draft.content ? (
        <ArticleDraftContentSection
          content={draft.content}
          label="Review"
          showCopy={true}
          thumbnailImageUrl={draft.thumbnailImageUrl}
        />
      ) : null;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArticleDraftDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedStep, setSelectedStep] = useState<StepKey | null>(null);

  const { data: draft, isLoading, isError, refetch } = useQuery({
    queryKey: ['article-draft', id],
    queryFn:  () => articleDraftApi.getOne(id!),
    enabled:  !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && IN_PROGRESS_STATUSES.includes(status) ? 3_000 : false;
    },
  });

  // 현재 데이터가 있는 단계 목록
  const availableSteps = useMemo<StepKey[]>(() => {
    if (!draft) return [];
    const steps: StepKey[] = [];
    if (draft.outline)            steps.push('outline');
    if (draft.content)            steps.push('content');
    if (draft.thumbnailImageUrl)  steps.push('thumbnail');
    if (draft.status === 'review_ready') steps.push('review');
    return steps;
  }, [draft]);

  // 새 단계가 생기면 가장 앞선 단계로 자동 이동 (이미 선택한 게 유효하면 유지)
  useEffect(() => {
    if (availableSteps.length === 0) return;
    setSelectedStep((prev) => {
      if (prev && availableSteps.includes(prev)) return prev;
      return availableSteps[availableSteps.length - 1];
    });
  }, [availableSteps]);

  // ─── Error state ─────────────────────────────────────────────────────────
  if (isError) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-8">
        <BackButton onClick={() => navigate('/article-drafts')} />
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-gray-600 font-medium">Failed to load draft</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (isLoading || !draft) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-8">
        <BackButton onClick={() => navigate('/article-drafts')} />
        <DetailSkeleton />
      </main>
    );
  }

  const isInProgress = IN_PROGRESS_STATUSES.includes(draft.status);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="max-w-4xl mx-auto px-8 py-8">
      <BackButton onClick={() => navigate('/article-drafts')} />

      <div className="space-y-4">
        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-snug">{draft.title}</h1>
              <p className="text-sm text-gray-400 mt-1">{draft.keyword}</p>
            </div>
            <ArticleDraftStatusBadge status={draft.status} />
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
            <span>Created: {formatDate(draft.createdAt)}</span>
            <span>·</span>
            <span>Updated: {formatDate(draft.updatedAt)}</span>
          </div>

          {isInProgress && (
            <div className="flex items-center gap-2 mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
              <span className="text-xs text-blue-600">
                Processing in progress — page will update automatically
              </span>
            </div>
          )}
        </div>

        {/* ── Pipeline (클릭 가능) ─────────────────────────────────────────── */}
        <ArticleDraftPipeline
          status={draft.status}
          selectedStep={selectedStep}
          availableSteps={availableSteps}
          onSelectStep={setSelectedStep}
        />

        {/* ── Error section (failed 일 때만) ───────────────────────────────── */}
        {draft.status === 'failed' && draft.errorMessage && (
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <h2 className="text-sm font-semibold text-red-700">Generation Error</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-red-600 leading-relaxed">{draft.errorMessage}</p>
            </div>
          </div>
        )}

        {/* ── 선택된 단계의 콘텐츠 ────────────────────────────────────────── */}
        <StepContent
          draft={draft}
          selectedStep={selectedStep}
          isInProgress={isInProgress}
        />
      </div>
    </main>
  );
}

// ─── BackButton helper ────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Article Drafts
    </button>
  );
}
