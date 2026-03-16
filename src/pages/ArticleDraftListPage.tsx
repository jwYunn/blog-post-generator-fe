import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { articleDraftApi } from '../api/articleDrafts';
import type { ArticleDraftListParams, ArticleDraftStatus } from '../types/articleDraft';
import { IN_PROGRESS_STATUSES } from '../types/articleDraft';
import ArticleDraftStatusBadge from '../components/article-draft/ArticleDraftStatusBadge';

// ─── 인라인 해시태그 복사 버튼 ────────────────────────────────────────────────

function InlineHashtags({ hashtags }: { hashtags: string[] | null }) {
  const [copied, setCopied] = useState(false);

  if (!hashtags || hashtags.length === 0) return null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hashtags.join(' '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {hashtags.slice(0, 6).map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100"
        >
          {tag}
        </span>
      ))}
      {hashtags.length > 6 && (
        <span className="text-[10px] text-gray-400 font-medium">
          +{hashtags.length - 6}
        </span>
      )}
      <button
        onClick={handleCopy}
        title="Copy all hashtags"
        className="ml-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        {copied ? (
          <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">Copied</span></>
        ) : (
          <><Copy className="w-3 h-3" />Copy</>
        )}
      </button>
    </div>
  );
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS: { label: string; value: ArticleDraftStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Queued', value: 'queued' },
  { label: 'Generating Outline', value: 'generating_outline' },
  { label: 'Outline Ready', value: 'outline_generated' },
  { label: 'Generating Content', value: 'generating_content' },
  { label: 'Content Ready', value: 'content_generated' },
  { label: 'Generating Thumbnail', value: 'generating_thumbnail' },
  { label: 'Review Ready', value: 'review_ready' },
  { label: 'Failed', value: 'failed' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

const SKELETON_WIDTHS = [
  ['65%', '20%', '18%', '10%'],
  ['80%', '15%', '18%', '10%'],
  ['55%', '22%', '18%', '10%'],
  ['70%', '18%', '18%', '10%'],
  ['60%', '20%', '18%', '10%'],
];

function SkeletonRow({ index }: { index: number }) {
  const widths = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];
  return (
    <tr className="border-b border-gray-50">
      {widths.map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArticleDraftListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useState<ArticleDraftListParams>({
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'DESC',
  });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['article-drafts', params],
    queryFn: () => articleDraftApi.getList(params),
    // Poll every 3 s if there are any in-progress drafts visible
    refetchInterval: (query) => {
      const drafts = query.state.data?.data ?? [];
      const hasInProgress = drafts.some((d) => IN_PROGRESS_STATUSES.includes(d.status));
      return hasInProgress ? 3_000 : false;
    },
  });

  const handleStatusFilter = useCallback((status: ArticleDraftStatus | undefined) => {
    setParams((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const handleRowClick = (id: string) => {
    navigate(`/article-drafts/${id}`);
  };

  const drafts = data?.data ?? [];

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Article Drafts</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            AI-generated drafts from approved topic candidates
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4 flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-400 font-medium mr-1">Status</span>
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const isSelected = params.status === opt.value;
          return (
            <button
              key={opt.label}
              onClick={() => handleStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Top fetching indicator */}
        <div
          className={`h-0.5 bg-blue-500 transition-all ${
            isFetching && !isLoading ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[280px]">
                  Title / Keyword
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[110px]">
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[110px]">
                  Created
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} index={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-red-400" />
                      </div>
                      <p className="text-gray-500 text-sm">Failed to load drafts</p>
                      <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : drafts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📄</span>
                      <p className="text-gray-500 text-sm mt-1">No article drafts found</p>
                      <p className="text-gray-400 text-xs">
                        Approve topic candidates to trigger draft generation
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                drafts.map((draft) => (
                  <tr
                    key={draft.id}
                    onClick={() => handleRowClick(draft.id)}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    {/* Title / Keyword */}
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900 leading-snug">{draft.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{draft.keyword}</p>
                      {(draft.status === 'content_generated' || draft.status === 'review_ready') && (
                        <InlineHashtags hashtags={draft.hashtags} />
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <ArticleDraftStatusBadge status={draft.status} />
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-4 text-gray-500 tabular-nums text-xs">
                      {formatRelativeTime(draft.updatedAt)}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-4 text-gray-500 tabular-nums text-xs">
                      {formatRelativeTime(draft.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result count */}
      {!isLoading && !isError && (
        <p className="text-xs text-gray-400 mt-3 text-right tabular-nums">
          {data?.total === 0
            ? '0 results'
            : `${drafts.length} of ${data?.total ?? 0}`}
        </p>
      )}
    </main>
  );
}
