import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { articleDraftApi } from '../api/articleDrafts';
import { IN_PROGRESS_STATUSES } from '../types/articleDraft';
import ArticleDraftStatusBadge from '../components/article-draft/ArticleDraftStatusBadge';
import ArticleDraftPipeline from '../components/article-draft/ArticleDraftPipeline';
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
      {/* Pipeline skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-8">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
              {i < 4 && <div className="flex-1 h-0.5 mx-1 bg-gray-100" />}
            </div>
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-2">
        {[80, 65, 70, 55, 75].map((w, i) => (
          <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArticleDraftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: draft, isLoading, isError, refetch } = useQuery({
    queryKey: ['article-draft', id],
    queryFn: () => articleDraftApi.getOne(id!),
    enabled: !!id,
    // Poll every 3 s while still in-progress
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && IN_PROGRESS_STATUSES.includes(status) ? 3_000 : false;
    },
  });

  // ─── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/article-drafts')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Article Drafts
        </button>

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

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || !draft) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/article-drafts')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Article Drafts
        </button>
        <DetailSkeleton />
      </main>
    );
  }

  const isInProgress = IN_PROGRESS_STATUSES.includes(draft.status);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="max-w-4xl mx-auto px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/article-drafts')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Article Drafts
      </button>

      <div className="space-y-4">
        {/* ── Header card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-snug">{draft.title}</h1>
              <p className="text-sm text-gray-400 mt-1">{draft.keyword}</p>
            </div>
            <ArticleDraftStatusBadge status={draft.status} />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
            <span>Created: {formatDate(draft.createdAt)}</span>
            <span>·</span>
            <span>Updated: {formatDate(draft.updatedAt)}</span>
          </div>

          {/* Polling indicator */}
          {isInProgress && (
            <div className="flex items-center gap-2 mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
              <span className="text-xs text-blue-600">
                Processing in progress — page will update automatically
              </span>
            </div>
          )}
        </div>

        {/* ── Pipeline ─────────────────────────────────────────────────────── */}
        <ArticleDraftPipeline status={draft.status} />

        {/* ── Error section (only when failed) ─────────────────────────────── */}
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

        {/* ── Outline section ───────────────────────────────────────────────── */}
        {draft.outline ? (
          <ArticleDraftOutlineSection outline={draft.outline} />
        ) : (
          !isInProgress &&
          draft.status !== 'failed' &&
          draft.status !== 'queued' && (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 text-center">
              <p className="text-sm text-gray-400">Outline not yet available</p>
            </div>
          )
        )}

        {/* ── Content section ───────────────────────────────────────────────── */}
        {draft.content ? (
          <ArticleDraftContentSection content={draft.content} />
        ) : (
          !isInProgress &&
          draft.status !== 'failed' &&
          draft.status !== 'queued' && (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 text-center">
              <p className="text-sm text-gray-400">Content not yet generated</p>
            </div>
          )
        )}

        {/* ── In-progress placeholder ───────────────────────────────────────── */}
        {isInProgress && !draft.outline && !draft.content && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="w-8 h-8 rounded-full border-3 border-blue-400 border-t-transparent animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Generating…</p>
              <p className="text-xs text-gray-400">This page refreshes automatically every 3 seconds</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
