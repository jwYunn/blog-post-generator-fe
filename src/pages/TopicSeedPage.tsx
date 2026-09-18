import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { topicSeedApi } from '../api/topicSeed';
import type { TopicSeed, TopicSeedListParams } from '../types/topicSeed';
import TopicSeedTable from '../components/topic-seed/TopicSeedTable';
import TopicSeedFilters from '../components/topic-seed/TopicSeedFilters';
import TopicSeedFormModal from '../components/topic-seed/TopicSeedFormModal';
import TopicSeedDeleteDialog from '../components/topic-seed/TopicSeedDeleteDialog';
import TopicSeedPagination from '../components/topic-seed/TopicSeedPagination';
import ToastContainer from '../components/Toast';
import { useToast } from '../hooks/useToast';

type SortableColumn = 'createdAt' | 'priority' | 'usedCount';

const INITIAL_PARAMS: TopicSeedListParams = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  order: 'desc',
};

export default function TopicSeedPage() {
  const queryClient = useQueryClient();

  // ─── 쿼리 파라미터 상태 ──────────────────────────────────────────────────────
  const [params, setParams] = useState<TopicSeedListParams>(INITIAL_PARAMS);

  // ─── 모달 / 다이얼로그 상태 ──────────────────────────────────────────────────
  const [formModal, setFormModal] = useState<{ open: boolean; seed?: TopicSeed }>({
    open: false,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; seed?: TopicSeed }>({
    open: false,
  });

  const { toasts, removeToast } = useToast();

  // ─── 데이터 패칭 ─────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['topic-seeds', params],
    queryFn: () => topicSeedApi.getList(params),
    staleTime: 30_000,
  });

  // ─── 핸들러 ──────────────────────────────────────────────────────────────────
  const handleFilterChange = (filters: Partial<TopicSeedListParams>) => {
    setParams((prev) => ({ ...prev, ...filters, page: 1 }));
  };

  const handleSort = (sortBy: SortableColumn) => {
    setParams((prev) => ({
      ...prev,
      sortBy,
      order: prev.sortBy === sortBy && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handlePageChange = (page: number, limit: number) => {
    setParams((prev) => ({ ...prev, page, limit }));
  };

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: ['topic-seeds'] });
  };

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        {/* 페이지 타이틀 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Topic Seeds</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage seed keywords used for blog post generation
            </p>
          </div>
          <button
            onClick={() => setFormModal({ open: true })}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Seed
          </button>
        </div>

        {/* 필터 */}
        <TopicSeedFilters params={params} onChange={handleFilterChange} />

        {/* 테이블 */}
        <TopicSeedTable
          data={data?.data ?? []}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          params={params}
          onSort={handleSort}
          onEdit={(seed) => setFormModal({ open: true, seed })}
          onDelete={(seed) => setDeleteDialog({ open: true, seed })}
          onRetry={refetch}
        />

        {/* 페이지네이션 */}
        <TopicSeedPagination
          total={data?.total ?? 0}
          page={params.page ?? 1}
          limit={params.limit ?? 20}
          onChange={handlePageChange}
        />
      </main>

      {/* 생성/수정 모달 */}
      <TopicSeedFormModal
        open={formModal.open}
        seed={formModal.seed}
        onClose={() => setFormModal({ open: false })}
        onSuccess={() => {
          setFormModal({ open: false });
          invalidateList();
        }}
      />

      {/* 삭제 확인 다이얼로그 */}
      <TopicSeedDeleteDialog
        open={deleteDialog.open}
        seed={deleteDialog.seed}
        onClose={() => setDeleteDialog({ open: false })}
        onSuccess={() => {
          setDeleteDialog({ open: false });
          invalidateList();
        }}
      />

      {/* Toast */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
