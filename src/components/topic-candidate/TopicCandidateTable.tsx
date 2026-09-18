import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Info, X, Tag, Target, Calendar, BookOpen, CheckCircle, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import axios from 'axios';
import type { TopicCandidate, TopicCandidateListParams, TopicCandidateStatus } from '../../types/topicCandidate';
import { topicCandidateApi } from '../../api/topicCandidate';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TopicCandidateStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-500',
};

const STATUS_DOT: Record<TopicCandidateStatus, string> = {
  pending: 'bg-yellow-400',
  approved: 'bg-green-500',
  rejected: 'bg-gray-400',
};

const STATUS_LABELS: Record<TopicCandidateStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const SEARCH_INTENT_STYLES: Record<string, string> = {
  informational: 'bg-blue-100 text-blue-700',
  comparison: 'bg-purple-100 text-purple-700',
  'how-to': 'bg-green-100 text-green-700',
  'mistake-fix': 'bg-orange-100 text-orange-700',
};

const TARGET_READER_STYLES: Record<string, string> = {
  beginner: 'bg-sky-100 text-sky-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
};

const VERDICT_STYLES = {
  keep:     { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  consider: { badge: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
  drop:     { badge: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SKELETON_WIDTHS = [
  ['60%', '12%', '10%', '8%', '8%', '6%', '6%', '6%', '6%'],
  ['75%', '12%', '10%', '8%', '8%', '6%', '6%', '6%', '6%'],
  ['50%', '12%', '10%', '8%', '8%', '6%', '6%', '6%', '6%'],
  ['70%', '12%', '10%', '8%', '8%', '6%', '6%', '6%', '6%'],
  ['65%', '12%', '10%', '8%', '8%', '6%', '6%', '6%', '6%'],
];

function SkeletonRow({ index }: { index: number }) {
  const widths = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];
  return (
    <tr className="border-b border-gray-50">
      {widths.map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard({ index }: { index: number }) {
  const widths = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];
  return (
    <li className="px-4 py-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded" style={{ width: widths[0] }} />
      <div className="h-5 w-40 bg-gray-100 rounded-full mt-3" />
      <div className="h-8 bg-gray-100 rounded-lg mt-3" />
    </li>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Badges & buttons (shared by table rows and mobile cards) ─────────────────

function StatusBadge({ status }: { status: TopicCandidateStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function SearchIntentBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEARCH_INTENT_STYLES[value] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {value}
    </span>
  );
}

function TargetReaderBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TARGET_READER_STYLES[value] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {value}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: NonNullable<TopicCandidate['verdict']> }) {
  const style = VERDICT_STYLES[verdict];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
    </span>
  );
}

function DetailButton({ onClick, className }: { onClick: () => void; className: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors ${className}`}
    >
      <Info className="w-3.5 h-3.5" />
      Detail
    </button>
  );
}

function ApproveButton({
  canApprove,
  isApproving,
  onClick,
  className,
}: {
  canApprove: boolean;
  isApproving: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={() => canApprove && onClick()}
      disabled={!canApprove || isApproving}
      title={
        !canApprove
          ? 'Already approved'
          : 'Approve and start article generation'
      }
      className={`inline-flex items-center gap-1 rounded-md font-medium transition-colors ${
        canApprove && !isApproving
          ? 'text-green-700 bg-green-50 hover:bg-green-100'
          : 'text-gray-300 bg-gray-50 cursor-not-allowed'
      } ${className}`}
    >
      {isApproving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CheckCircle className="w-3.5 h-3.5" />
      )}
      Approve
    </button>
  );
}

// ─── Error / Empty states (shared by table and card list) ─────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-gray-500 text-sm">Failed to load data</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-4xl">📭</span>
      <p className="text-gray-500 text-sm mt-1">No candidates found</p>
      <p className="text-gray-400 text-xs">Run Generate on a Topic Seed to create candidates</p>
    </div>
  );
}

// ─── Mobile card (replaces a table row below the md breakpoint) ───────────────

function CandidateCard({
  candidate,
  isApproving,
  onDetail,
  onApprove,
}: {
  candidate: TopicCandidate;
  isApproving: boolean;
  onDetail: () => void;
  onApprove: () => void;
}) {
  const isEvaluated = candidate.overallScore != null;
  const canApprove = candidate.status === 'pending' || candidate.status === 'rejected';

  return (
    <li className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 font-medium text-gray-900 leading-snug break-words">{candidate.title}</p>
        {isEvaluated && (
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold text-gray-800 tabular-nums">
              {Number(candidate.overallScore).toFixed(1)}
            </p>
            {candidate.rank != null && (
              <p className="text-xs font-bold text-gray-500 tabular-nums">#{candidate.rank}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <StatusBadge status={candidate.status} />
        {candidate.verdict && <VerdictBadge verdict={candidate.verdict} />}
        {candidate.searchIntent && <SearchIntentBadge value={candidate.searchIntent} />}
        {candidate.targetReader && <TargetReaderBadge value={candidate.targetReader} />}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <DetailButton onClick={onDetail} className="flex-1 justify-center px-3 py-2 text-sm" />
        <ApproveButton
          canApprove={canApprove}
          isApproving={isApproving}
          onClick={onApprove}
          className="flex-1 justify-center px-3 py-2 text-sm"
        />
      </div>
    </li>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ candidate, onClose }: { candidate: TopicCandidate; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-600 to-violet-700 px-6 pt-6 pb-5 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[candidate.status]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[candidate.status]}`} />
              {STATUS_LABELS[candidate.status]}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white leading-snug pr-8 mb-4">{candidate.title}</h2>
          <div className="flex flex-wrap gap-2">
            {candidate.searchIntent && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${SEARCH_INTENT_STYLES[candidate.searchIntent] ?? 'bg-gray-100 text-gray-600'}`}
              >
                <Target className="w-3 h-3" />
                {candidate.searchIntent}
              </span>
            )}
            {candidate.targetReader && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${TARGET_READER_STYLES[candidate.targetReader] ?? 'bg-gray-100 text-gray-600'}`}
              >
                <BookOpen className="w-3 h-3" />
                {candidate.targetReader}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white">
              <Tag className="w-3 h-3" />
              {candidate.keyword}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {candidate.whyThisTopic && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1.5">
                Why This Topic
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">{candidate.whyThisTopic}</p>
            </div>
          )}
          {candidate.outlinePreview && candidate.outlinePreview.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Outline Preview
              </p>
              <ol className="space-y-2">
                {candidate.outlinePreview.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Created {formatDate(candidate.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

type SortableColumn = NonNullable<TopicCandidateListParams['sortBy']>;

const MOBILE_SORT_OPTIONS: { column: SortableColumn; label: string }[] = [
  { column: 'overallScore', label: 'Score' },
  { column: 'rank',         label: 'Rank'  },
];

interface Props {
  data: TopicCandidate[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  params: TopicCandidateListParams;
  onSort: (sortBy: SortableColumn) => void;
  onRetry: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TopicCandidateTable({
  data,
  isLoading,
  isFetching,
  isError,
  params,
  onSort,
  onRetry,
}: Props) {
  const queryClient = useQueryClient();
  const [detailCandidate, setDetailCandidate] = useState<TopicCandidate | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const COL_SPAN = 9;

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      topicCandidateApi.updateStatus(id, { status: 'approved' }),
    onMutate: (id) => setApprovingId(id),
    onSettled: () => setApprovingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-candidates'] });
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to approve candidate.')
        : 'Failed to approve candidate.';
      alert(message);
    },
  });

  function SortIcon({ column }: { column: SortableColumn }) {
    if (params.sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return params.sortOrder === 'ASC'
      ? <ArrowUp className="w-3 h-3 text-blue-500" />
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Top fetching indicator */}
        <div
          className={`h-0.5 bg-blue-500 transition-all ${isFetching && !isLoading ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Mobile sort bar — stands in for the sortable Score / Rank headers */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
          <span className="text-xs text-gray-400 font-medium mr-1">Sort</span>
          {MOBILE_SORT_OPTIONS.map(({ column, label }) => (
            <button
              key={column}
              onClick={() => onSort(column)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                params.sortBy === column ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
              <SortIcon column={column} />
            </button>
          ))}
        </div>

        {/* Mobile card list */}
        <ul className="md:hidden divide-y divide-gray-50">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)
          ) : isError ? (
            <li className="px-4 py-20 text-center">
              <ErrorState onRetry={onRetry} />
            </li>
          ) : data.length === 0 ? (
            <li className="px-4 py-20 text-center">
              <EmptyState />
            </li>
          ) : (
            data.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isApproving={approvingId === candidate.id}
                onDetail={() => setDetailCandidate(candidate)}
                onApprove={() => approveMutation.mutate(candidate.id)}
              />
            ))
          )}
        </ul>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {[
                  { label: 'Title',         className: 'min-w-[240px]' },
                  { label: 'Search Intent', className: 'min-w-[120px]' },
                  { label: 'Reader' },
                  { label: 'Verdict',       className: 'min-w-[90px]' },
                  { label: 'Status' },
                  { label: '' },  // Detail
                  { label: '' },  // Approve
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${h.className ?? ''}`}
                  >
                    {h.label}
                  </th>
                ))}
                {/* Score — sortable */}
                <th className="px-4 py-3 min-w-[72px]">
                  <button
                    onClick={() => onSort('overallScore')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition-colors"
                  >
                    Score
                    <SortIcon column="overallScore" />
                  </button>
                </th>
                {/* Rank — sortable */}
                <th className="px-4 py-3 min-w-[64px]">
                  <button
                    onClick={() => onSort('rank')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition-colors"
                  >
                    Rank
                    <SortIcon column="rank" />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-4 py-20 text-center">
                    <ErrorState onRetry={onRetry} />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-4 py-20 text-center">
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                data.map((candidate) => {
                  const isEvaluated = candidate.overallScore != null;
                  const canApprove = candidate.status === 'pending' || candidate.status === 'rejected';
                  const isApproving = approvingId === candidate.id;

                  return (
                    <tr key={candidate.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Title */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-900">{candidate.title}</span>
                      </td>

                      {/* Search Intent */}
                      <td className="px-4 py-3.5">
                        {candidate.searchIntent ? (
                          <SearchIntentBadge value={candidate.searchIntent} />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Target Reader */}
                      <td className="px-4 py-3.5">
                        {candidate.targetReader ? (
                          <TargetReaderBadge value={candidate.targetReader} />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Verdict */}
                      <td className="px-4 py-3.5">
                        {candidate.verdict ? (
                          <VerdictBadge verdict={candidate.verdict} />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={candidate.status} />
                      </td>

                      {/* Detail 버튼 */}
                      <td className="px-4 py-3.5">
                        <DetailButton
                          onClick={() => setDetailCandidate(candidate)}
                          className="px-2.5 py-1 text-xs"
                        />
                      </td>

                      {/* Approve button */}
                      <td className="px-4 py-3.5">
                        <ApproveButton
                          canApprove={canApprove}
                          isApproving={isApproving}
                          onClick={() => approveMutation.mutate(candidate.id)}
                          className="px-2.5 py-1 text-xs"
                        />
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3.5">
                        {isEvaluated ? (
                          <span className="text-sm font-semibold text-gray-800 tabular-nums">
                            {Number(candidate.overallScore).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Rank */}
                      <td className="px-4 py-3.5">
                        {isEvaluated && candidate.rank != null ? (
                          <span className="text-xs font-bold text-gray-500 tabular-nums">
                            #{candidate.rank}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailCandidate && (
        <DetailModal candidate={detailCandidate} onClose={() => setDetailCandidate(null)} />
      )}
    </>
  );
}
