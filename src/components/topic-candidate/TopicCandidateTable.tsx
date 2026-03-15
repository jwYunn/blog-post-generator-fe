import { ChevronsUpDown, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import type { TopicCandidate, TopicCandidateListParams, TopicCandidateStatus } from '../../types/topicCandidate';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

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

type SortableColumn = 'createdAt' | 'score';

// ─── 서브 컴포넌트 ──────────────────────────────────────────────────────────────

function SortIcon({ column, params }: { column: SortableColumn; params: TopicCandidateListParams }) {
  if (params.sortBy !== column)
    return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 ml-1 inline-block" />;
  return params.sortOrder === 'ASC' ? (
    <ChevronUp className="w-3.5 h-3.5 text-blue-500 ml-1 inline-block" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-blue-500 ml-1 inline-block" />
  );
}

function ScoreBadge({ score }: { score: number }) {
  // score가 0~1 범위라면 100 곱해서 백분율로 표시
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  const colorClass =
    pct >= 70
      ? 'bg-green-100 text-green-700'
      : pct >= 40
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-600';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${colorClass}`}>
      {pct}
    </span>
  );
}

const SKELETON_WIDTHS = [
  ['60%', '45%', '10%', '15%', '20%'],
  ['75%', '55%', '10%', '15%', '20%'],
  ['50%', '40%', '10%', '15%', '20%'],
  ['70%', '50%', '10%', '15%', '20%'],
  ['65%', '60%', '10%', '15%', '20%'],
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  data: TopicCandidate[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  params: TopicCandidateListParams;
  onSort: (sortBy: SortableColumn) => void;
  onRetry: () => void;
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

export default function TopicCandidateTable({
  data,
  isLoading,
  isFetching,
  isError,
  params,
  onSort,
  onRetry,
}: Props) {
  const headers: Array<{ key: string; label: string; sortable?: SortableColumn; className?: string }> = [
    { key: 'title', label: 'Title', className: 'min-w-[200px]' },
    { key: 'keyword', label: 'Keyword', className: 'min-w-[120px]' },
    { key: 'score', label: 'Score', sortable: 'score' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created', sortable: 'createdAt', className: 'min-w-[100px]' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 상단 fetching 인디케이터 */}
      <div
        className={`h-0.5 bg-blue-500 transition-all ${isFetching && !isLoading ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* 헤더 */}
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={h.sortable ? () => onSort(h.sortable!) : undefined}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                    h.sortable
                      ? 'cursor-pointer select-none hover:text-gray-700 hover:bg-gray-100 transition-colors'
                      : ''
                  } ${h.className ?? ''}`}
                >
                  {h.label}
                  {h.sortable && <SortIcon column={h.sortable} params={params} />}
                </th>
              ))}
            </tr>
          </thead>

          {/* 바디 */}
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)
            ) : isError ? (
              <tr>
                <td colSpan={5} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-gray-500 text-sm">데이터를 불러오는 중 오류가 발생했습니다</p>
                    <button
                      onClick={onRetry}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📭</span>
                    <p className="text-gray-500 text-sm mt-1">생성된 Candidate가 없습니다</p>
                    <p className="text-gray-400 text-xs">Topic Seeds에서 Generate를 실행해보세요</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  {/* title */}
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-gray-900">{candidate.title}</span>
                  </td>

                  {/* keyword */}
                  <td className="px-4 py-3.5">
                    <span className="text-gray-600">{candidate.keyword}</span>
                  </td>

                  {/* score */}
                  <td className="px-4 py-3.5">
                    <ScoreBadge score={candidate.score} />
                  </td>

                  {/* status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[candidate.status]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[candidate.status]}`} />
                      {STATUS_LABELS[candidate.status]}
                    </span>
                  </td>

                  {/* createdAt */}
                  <td className="px-4 py-3.5 text-gray-500 tabular-nums">
                    {formatDate(candidate.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
