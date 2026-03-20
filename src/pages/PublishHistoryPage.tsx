import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { publishRecordsApi } from '../api/publishRecords';
import type { PublishRecord } from '../types/articleDraft';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';
import PublishRecordFormModal from '../components/article-draft/PublishRecordFormModal';

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
  const widths = ['20%', '50%', '25%', '20%', '10%'];
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

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <DialogTitle className="text-base font-semibold text-gray-900 mb-2">
            발행 내역 삭제
          </DialogTitle>
          <p className="text-sm text-gray-500 mb-6">
            이 발행 내역을 삭제하면 복구할 수 없습니다. 계속하시겠습니까?
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublishHistoryPage() {
  const queryClient = useQueryClient();
  const { toasts, addToast, removeToast } = useToast();
  const [page, setPage] = useState(1);

  // form modal 상태
  const [formModal, setFormModal] = useState<{
    open: boolean;
    record?: PublishRecord;
  }>({ open: false });

  // delete confirm 상태
  const [deleteTarget, setDeleteTarget] = useState<PublishRecord | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['publish-records', page],
    queryFn: () => publishRecordsApi.getList({ page, limit: LIMIT }),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => publishRecordsApi.remove(id),
    onSuccess: () => {
      addToast('발행 내역이 삭제되었습니다.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['publish-records'] });
    },
    onError: () => {
      addToast('삭제에 실패했습니다. 다시 시도해주세요.', 'error');
    },
  });

  const records = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleFormSuccess = () => {
    setFormModal({ open: false });
    queryClient.invalidateQueries({ queryKey: ['publish-records'] });
  };

  return (
    <>
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
          <button
            onClick={() => setFormModal({ open: true })}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Actions
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

                            {/* Actions */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    setFormModal({ open: true, record })
                                  }
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="수정"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(record)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

      {/* Form Modal (create / edit) */}
      <PublishRecordFormModal
        open={formModal.open}
        record={formModal.record}
        onClose={() => setFormModal({ open: false })}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
