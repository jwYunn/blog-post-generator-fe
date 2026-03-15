import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { topicSeedApi } from '../../api/topicSeed';
import type { TopicSeed } from '../../types/topicSeed';

interface Props {
  open: boolean;
  seed?: TopicSeed;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TopicSeedDeleteDialog({ open, seed, onClose, onSuccess }: Props) {
  const mutation = useMutation({
    mutationFn: () => topicSeedApi.delete(seed!.id),
    onSuccess,
    onError: () => {
      // 에러 시에도 다이얼로그는 유지 (사용자가 확인 가능하도록)
    },
  });

  const handleConfirm = () => {
    mutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />

      {/* 다이얼로그 */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-gray-900">
                Delete Seed
              </DialogTitle>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                Are you sure? This action cannot be undone.
              </p>
              {seed && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-gray-400 mb-0.5">Target</p>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {seed.seed}
                  </p>
                </div>
              )}
              {mutation.isError && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  Failed to delete. Please try again.
                </p>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={mutation.isPending}
              className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-w-[72px]"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting
                </span>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
