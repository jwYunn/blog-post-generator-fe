import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import { publishRecordsApi } from '../api/publishRecords';
import type { PublishRecord } from '../types/articleDraft';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const LIMIT = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** URL에서 프로토콜·슬래시 제거: "https://example.com/65" → "example.com/65" */
function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

// ─── SkeletonRow ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  const widths = ['20%', '50%', '25%', '20%'];
  return (
    <tr className="border-b border-gray-50">
      {widths.map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="animate-pulse bg-gray-100 rounded h-4"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── ScheduleCell ─────────────────────────────────────────────────────────────

function ScheduleCell({ record }: { record: PublishRecord }) {
  if (!record.schedule) {
    return <span className="text-gray-300">—</span>;
  }

  if (record.schedule.mode === 'now') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
        즉시 발행
      </span>
    );
  }

  return (
    <div>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        예약 발행
      </span>
      <p className="text-xs text-gray-400 mt-1">
        {formatDate(record.schedule.scheduledAt)}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublishHistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['publish-records', page],
    queryFn: () => publishRecordsApi.getList({ page, limit: LIMIT }),
    staleTime: 30_000,
  });

  const records = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Publish History</h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-0.5">
              총 {total.toLocaleString()}건
            </p>
          )}
        </div>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 빈 상태 */}
        {!isLoading && records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Globe className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm">발행 내역이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                      Draft
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[280px]">
                      Permalink
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">
                      Schedule
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                      Published At
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} />
                      ))
                    : records.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-blue-50/20 transition-colors"
                        >
                          {/* Draft */}
                          <td className="px-4 py-4">
                            <Link
                              to={`/article-drafts/${record.draftId}`}
                              className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {record.draftId.slice(0, 8)}
                            </Link>
                          </td>

                          {/* Permalink */}
                          <td className="px-4 py-4">
                            {record.permalink ? (
                              <a
                                href={record.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline text-xs break-all"
                              >
                                {stripProtocol(record.permalink)}
                              </a>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>

                          {/* Schedule */}
                          <td className="px-4 py-4">
                            <ScheduleCell record={record} />
                          </td>

                          {/* Published At */}
                          <td className="px-4 py-4 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                            {formatDate(record.createdAt)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {total}개 중 {(page - 1) * LIMIT + 1}–
                  {Math.min(page * LIMIT, total)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
