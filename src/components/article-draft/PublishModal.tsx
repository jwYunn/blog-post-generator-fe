import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { articleDraftApi } from '../../api/articleDrafts';
import type { PublishJobMode } from '../../types/articleDraft';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast';

// ─── Min time helper (current time + 1 minute) ───────────────────────────────

function getMinDatetimeLocal(): string {
  const d = new Date(Date.now() + 60_000);
  // datetime-local format: "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  draftId: string;
  draftTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublishModal({
  open,
  draftId,
  draftTitle,
  onClose,
  onSuccess,
}: Props) {
  const { toasts, addToast, removeToast } = useToast();

  const [mode, setMode] = useState<PublishJobMode>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  // Reset state every time the modal opens
  useEffect(() => {
    if (!open) return;
    setMode('now');
    setScheduledAt('');
    setScheduleError('');
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => {
      if (mode === 'schedule') {
        return articleDraftApi.publishDraft(draftId, {
          mode: 'schedule',
          scheduledAt: new Date(scheduledAt).toISOString(),
        });
      }
      return articleDraftApi.publishDraft(draftId, { mode: 'now' });
    },
    onSuccess: () => {
      addToast('Publish job created.', 'success');
      // Short delay so the toast is briefly visible before calling onSuccess
      setTimeout(() => onSuccess(), 400);
    },
    onError: () => {
      addToast('Failed to publish. Please try again.', 'error');
    },
  });

  const handleSubmit = () => {
    if (mode === 'schedule') {
      if (!scheduledAt) {
        setScheduleError('Please select a scheduled time.');
        return;
      }
      const selected = new Date(scheduledAt).getTime();
      if (selected <= Date.now() + 59_000) {
        setScheduleError('Must be at least 1 minute in the future.');
        return;
      }
      setScheduleError('');
    }
    mutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />

        {/* Modal container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <DialogTitle className="text-base font-semibold text-gray-900">
                Publish
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Title preview */}
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                <span className="font-medium text-gray-700">{draftTitle}</span>
              </p>

              {/* Publish mode selector */}
              <div className="space-y-2.5">
                <p className="text-sm font-medium text-gray-700">Publish method</p>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="publishMode"
                    value="now"
                    checked={mode === 'now'}
                    onChange={() => {
                      setMode('now');
                      setScheduleError('');
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-800">Publish now</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="publishMode"
                    value="schedule"
                    checked={mode === 'schedule'}
                    onChange={() => setMode('schedule')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-800">Schedule</span>
                </label>
              </div>

              {/* Scheduled time input */}
              {mode === 'schedule' && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Scheduled time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={getMinDatetimeLocal()}
                    onChange={(e) => {
                      setScheduledAt(e.target.value);
                      setScheduleError('');
                    }}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      scheduleError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {scheduleError && (
                    <p className="text-red-500 text-xs">{scheduleError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-w-[80px]"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing
                  </span>
                ) : (
                  'Publish'
                )}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
