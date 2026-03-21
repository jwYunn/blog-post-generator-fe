import { useState } from 'react';
import { RefreshCw, Info, X, Tag, Target, Calendar, BookOpen, FlaskConical, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { TopicCandidate, TopicCandidateListParams, TopicCandidateStatus, EvaluationDetail } from '../../types/topicCandidate';

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

const EVAL_LABELS: Record<keyof EvaluationDetail, string> = {
  search_intent_clarity: 'Search Intent Clarity',
  topic_specificity:     'Topic Specificity',
  seo_title_quality:     'SEO Title Quality',
  practical_value:       'Practical Value',
  outline_feasibility:   'Outline Feasibility',
  uniqueness:            'Uniqueness',
};

const EVAL_KEYS: (keyof EvaluationDetail)[] = [
  'search_intent_clarity',
  'topic_specificity',
  'seo_title_quality',
  'practical_value',
  'outline_feasibility',
  'uniqueness',
];

// ─── 서브 컴포넌트 ──────────────────────────────────────────────────────────────

const SKELETON_WIDTHS = [
  ['60%', '12%', '10%', '6%', '5%', '8%', '8%', '6%', '6%'],
  ['75%', '12%', '10%', '6%', '5%', '8%', '8%', '6%', '6%'],
  ['50%', '12%', '10%', '6%', '5%', '8%', '8%', '6%', '6%'],
  ['70%', '12%', '10%', '6%', '5%', '8%', '8%', '6%', '6%'],
  ['65%', '12%', '10%', '6%', '5%', '8%', '8%', '6%', '6%'],
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Detail Modal (기존 — 내용 상세) ───────────────────────────────────────────

function DetailModal({ candidate, onClose }: { candidate: TopicCandidate; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4"
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

// ─── Evaluation Modal (신규 — 평가 상세) ───────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max((score / 10) * 100, 0), 100);
  const color =
    score >= 8 ? 'bg-emerald-500' :
    score >= 6 ? 'bg-amber-400' :
                 'bg-red-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-gray-700 tabular-nums">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function EvaluationModal({ candidate, onClose }: { candidate: TopicCandidate; onClose: () => void }) {
  const verdict = candidate.verdict;
  const verdictStyle = verdict ? VERDICT_STYLES[verdict] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pt-6 pb-5 rounded-t-2xl shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Rank + Verdict */}
          <div className="flex items-center gap-2 mb-3">
            {candidate.rank && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                #{candidate.rank}
              </span>
            )}
            {verdictStyle && verdict && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${verdictStyle.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${verdictStyle.dot}`} />
                {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
              </span>
            )}
          </div>

          <h2 className="text-base font-bold text-white leading-snug pr-8 mb-3">
            {candidate.title}
          </h2>

          {/* Overall Score */}
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-extrabold text-white tabular-nums leading-none">
              {candidate.overallScore != null ? Number(candidate.overallScore).toFixed(1) : '—'}
            </span>
            <span className="text-white/60 text-sm mb-1">/ 10</span>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">

          {/* Strengths */}
          {candidate.strengths && candidate.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Strengths
                </p>
              </div>
              <ul className="space-y-1.5">
                {candidate.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {candidate.weaknesses && candidate.weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                  Weaknesses
                </p>
              </div>
              <ul className="space-y-1.5">
                {candidate.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-red-100 text-red-500 text-xs font-bold flex items-center justify-center">✗</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evaluation Breakdown */}
          {candidate.evaluationDetail && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Evaluation Breakdown
              </p>
              <div className="space-y-3">
                {EVAL_KEYS.map((key) => {
                  const score = candidate.evaluationDetail?.[key] ?? 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">{EVAL_LABELS[key]}</span>
                      </div>
                      <ScoreBar score={score} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Created At */}
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
  const [detailCandidate, setDetailCandidate] = useState<TopicCandidate | null>(null);
  const [evalCandidate, setEvalCandidate] = useState<TopicCandidate | null>(null);

  const COL_SPAN = 9;

  function SortIcon({ column }: { column: SortableColumn }) {
    if (params.sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return params.sortOrder === 'ASC'
      ? <ArrowUp className="w-3 h-3 text-blue-500" />
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 상단 fetching 인디케이터 */}
        <div
          className={`h-0.5 bg-blue-500 transition-all ${isFetching && !isLoading ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {[
                  { label: 'Title',         className: 'min-w-[240px]' },
                  { label: 'Search Intent', className: 'min-w-[120px]' },
                  { label: 'Reader' },
                  { label: 'Verdict', className: 'min-w-[90px]' },
                  { label: 'Status' },
                  { label: '' },
                  { label: '' },
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${h.className ?? ''}`}
                  >
                    {h.label}
                  </th>
                ))}
                {/* Score — 정렬 가능 */}
                <th className="px-4 py-3 min-w-[72px]">
                  <button
                    onClick={() => onSort('overallScore')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition-colors"
                  >
                    Score
                    <SortIcon column="overallScore" />
                  </button>
                </th>
                {/* Rank — 정렬 가능 */}
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
                <tr>
                  <td colSpan={COL_SPAN} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📭</span>
                      <p className="text-gray-500 text-sm mt-1">No candidates found</p>
                      <p className="text-gray-400 text-xs">Run Generate on a Topic Seed to create candidates</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((candidate) => {
                  const verdict = candidate.verdict;
                  const verdictStyle = verdict ? VERDICT_STYLES[verdict] : null;
                  const isEvaluated = candidate.overallScore != null;

                  return (
                    <tr key={candidate.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Title */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-900">{candidate.title}</span>
                      </td>

                      {/* Search Intent */}
                      <td className="px-4 py-3.5">
                        {candidate.searchIntent ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEARCH_INTENT_STYLES[candidate.searchIntent] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {candidate.searchIntent}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Target Reader */}
                      <td className="px-4 py-3.5">
                        {candidate.targetReader ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TARGET_READER_STYLES[candidate.targetReader] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {candidate.targetReader}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Verdict */}
                      <td className="px-4 py-3.5">
                        {verdictStyle && verdict ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${verdictStyle.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${verdictStyle.dot}`} />
                            {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[candidate.status]}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[candidate.status]}`} />
                          {STATUS_LABELS[candidate.status]}
                        </span>
                      </td>

                      {/* Detail 버튼 */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setDetailCandidate(candidate)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </td>

                      {/* Eval 버튼 */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => isEvaluated && setEvalCandidate(candidate)}
                          disabled={!isEvaluated}
                          title={!isEvaluated ? 'Not evaluated yet' : 'View evaluation'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            isEvaluated
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-gray-300 bg-gray-50 cursor-not-allowed'
                          }`}
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          Eval
                        </button>
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
      {evalCandidate && (
        <EvaluationModal candidate={evalCandidate} onClose={() => setEvalCandidate(null)} />
      )}
    </>
  );
}
