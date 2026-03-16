import { ChevronsUpDown, ChevronUp, ChevronDown, Pencil, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TopicSeed, TopicSeedListParams } from '../../types/topicSeed';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  meaning: 'bg-blue-100 text-blue-700',
  difference: 'bg-purple-100 text-purple-700',
  example: 'bg-emerald-100 text-emerald-700',
  phrases: 'bg-orange-100 text-orange-700',
  grammar: 'bg-rose-100 text-rose-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  meaning: 'Meaning',
  difference: 'Difference',
  example: 'Example',
  phrases: 'Phrases',
  grammar: 'Grammar',
};

// priority 1~10 색상 단계 (저→고)
const PRIORITY_STYLES: Record<number, string> = {
  1: 'bg-gray-100 text-gray-400',
  2: 'bg-gray-100 text-gray-500',
  3: 'bg-sky-100 text-sky-600',
  4: 'bg-blue-100 text-blue-600',
  5: 'bg-green-100 text-green-600',
  6: 'bg-teal-100 text-teal-600',
  7: 'bg-yellow-100 text-yellow-700',
  8: 'bg-orange-100 text-orange-600',
  9: 'bg-red-100 text-red-600',
  10: 'bg-red-200 text-red-700',
};

type SortableColumn = 'createdAt' | 'priority' | 'usedCount';

// ─── 서브 컴포넌트 ──────────────────────────────────────────────────────────────

function SortIcon({ column, params }: { column: SortableColumn; params: TopicSeedListParams }) {
  if (params.sortBy !== column)
    return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 ml-1 inline-block" />;
  return params.order === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5 text-blue-500 ml-1 inline-block" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-blue-500 ml-1 inline-block" />
  );
}

const SKELETON_WIDTHS = [
  ['70%', '40%', '15%', '15%', '12%', '20%', '22%', '10%'],
  ['55%', '60%', '15%', '15%', '12%', '20%', '22%', '10%'],
  ['80%', '50%', '15%', '15%', '12%', '20%', '22%', '10%'],
  ['65%', '45%', '15%', '15%', '12%', '20%', '22%', '10%'],
  ['75%', '55%', '15%', '15%', '12%', '20%', '22%', '10%'],
];

function SkeletonRow({ index }: { index: number }) {
  const widths = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];
  return (
    <tr className="border-b border-gray-50">
      {widths.map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-4 bg-gray-200 rounded animate-pulse"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  data: TopicSeed[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  params: TopicSeedListParams;
  onSort: (sortBy: SortableColumn) => void;
  onEdit: (seed: TopicSeed) => void;
  onDelete: (seed: TopicSeed) => void;
  onRetry: () => void;
  onGenerate: (seedId: string) => void;
  generatingSeedIds: Record<string, boolean>;
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

export default function TopicSeedTable({
  data,
  isLoading,
  isFetching,
  isError,
  params,
  onSort,
  onEdit,
  onDelete,
  onRetry,
  onGenerate,
  generatingSeedIds,
}: Props) {
  const navigate = useNavigate();

  const headers: Array<{ key: string; label: string; sortable?: SortableColumn; className?: string }> = [
    { key: 'seed', label: 'Seed', className: 'min-w-[160px]' },
    { key: 'category', label: 'Category' },
    { key: 'priority', label: 'Priority', sortable: 'priority' },
    { key: 'isActive', label: 'Status' },
    { key: 'usedCount', label: 'Used', sortable: 'usedCount' },
    { key: 'lastUsedAt', label: 'Last Used', className: 'min-w-[100px]' },
    { key: 'createdAt', label: 'Created', sortable: 'createdAt', className: 'min-w-[100px]' },
    { key: 'actions', label: '', className: 'w-36' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 상단 fetching 인디케이터 */}
      <div className={`h-0.5 bg-blue-500 transition-all ${isFetching && !isLoading ? 'opacity-100' : 'opacity-0'}`} />

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
                    h.sortable ? 'cursor-pointer select-none hover:text-gray-700 hover:bg-gray-100 transition-colors' : ''
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
            {/* 로딩 스켈레톤 */}
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)
            ) : isError ? (
              /* 에러 */
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center">
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
                </td>
              </tr>
            ) : data.length === 0 ? (
              /* 빈 목록 */
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🌱</span>
                    <p className="text-gray-500 text-sm mt-1">No seeds found</p>
                    <p className="text-gray-400 text-xs">Click the New Seed button to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              /* 데이터 */
              data.map((seed) => (
                <tr
                  key={seed.id}
                  onClick={() => navigate(`/topic-candidates?seedId=${seed.id}`)}
                  className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                >
                  {/* seed */}
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-gray-900">{seed.seed}</span>
                    {seed.normalizedSeed !== seed.seed && (
                      <div className="text-xs text-gray-400 mt-0.5">{seed.normalizedSeed}</div>
                    )}
                  </td>

                  {/* category */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[seed.category]}`}
                    >
                      {CATEGORY_LABELS[seed.category]}
                    </span>
                  </td>

                  {/* priority */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${PRIORITY_STYLES[seed.priority]}`}
                    >
                      {seed.priority}
                    </span>
                  </td>

                  {/* isActive */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        seed.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${seed.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                      />
                      {seed.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* usedCount */}
                  <td className="px-4 py-3.5 text-gray-600 tabular-nums">
                    {seed.usedCount.toLocaleString()}
                  </td>

                  {/* lastUsedAt */}
                  <td className="px-4 py-3.5 text-gray-500 tabular-nums">
                    {formatDate(seed.lastUsedAt)}
                  </td>

                  {/* createdAt */}
                  <td className="px-4 py-3.5 text-gray-500 tabular-nums">
                    {formatDate(seed.createdAt)}
                  </td>

                  {/* 액션 */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {/* Generate 버튼 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onGenerate(seed.id); }}
                        disabled={!seed.isActive || generatingSeedIds[seed.id]}
                        title={!seed.isActive ? 'Cannot generate for inactive seeds' : 'Generate candidates'}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          seed.isActive && !generatingSeedIds[seed.id]
                            ? 'text-violet-700 bg-violet-50 hover:bg-violet-100'
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        }`}
                      >
                        {generatingSeedIds[seed.id] ? (
                          <span className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Generate
                      </button>

                      {/* Edit / Delete — hover 시 표시 */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(seed); }}
                          title="Edit"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(seed); }}
                          title="Delete"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
