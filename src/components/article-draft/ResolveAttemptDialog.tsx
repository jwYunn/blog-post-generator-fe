import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { X, CircleX, CircleCheck } from 'lucide-react';
import axios from 'axios';
import { publishRecordsApi } from '../../api/publishRecords';
import type { PublishRecord } from '../../types/articleDraft';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast';

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  permalink: z.string().url('Please enter a valid URL').or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** The attempt to resolve; null closes the dialog */
  record: PublishRecord | null;
  draftTitle?: string;
  onClose: () => void;
  onResolved: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Settles a publish attempt that never reported back. Only someone looking at
 * the blog can tell whether the post went up, and the server keeps refusing to
 * publish the draft again until they say which it was.
 */
export default function ResolveAttemptDialog({ record, draftTitle, onClose, onResolved }: Props) {
  const { toasts, addToast, removeToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { permalink: '' },
  });

  useEffect(() => {
    if (record) reset({ permalink: '' });
  }, [record, reset]);

  const mutation = useMutation({
    mutationFn: (payload: { status: 'failed' } | { status: 'published'; permalink: string | null }) =>
      publishRecordsApi.update(record!.id, payload),
    onSuccess: (_, payload) => {
      addToast(
        payload.status === 'failed'
          ? 'Marked as failed — this draft can be published again.'
          : 'Marked as published.',
      );
      onResolved();
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      addToast(
        Array.isArray(message) ? message.join(', ') : (message ?? 'Failed to update. Please try again.'),
        'error',
      );
    },
  });

  const title = draftTitle ?? record?.draft?.title;

  return (
    <>
      <Dialog open={!!record} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <DialogTitle className="text-base font-semibold text-gray-900">
                Resolve publish attempt
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                This attempt never reported back, so the post may or may not be live. Check{' '}
                <span className="font-medium text-gray-800">{record?.blogName ?? 'the blog'}</span>
                {title && (
                  <>
                    {' '}for <span className="font-medium text-gray-800">"{title}"</span>
                  </>
                )}
                , then pick what you found.
              </p>

              {/* Not on the blog */}
              <div className="rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">It is not on the blog</p>
                    <p className="text-xs text-gray-400 mt-0.5">The draft can be published again</p>
                  </div>
                  <button
                    onClick={() => mutation.mutate({ status: 'failed' })}
                    disabled={mutation.isPending}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    <CircleX className="w-3.5 h-3.5" />
                    Mark failed
                  </button>
                </div>
              </div>

              {/* On the blog */}
              <form
                onSubmit={handleSubmit((v) =>
                  mutation.mutate({ status: 'published', permalink: v.permalink.trim() || null }),
                )}
                className="rounded-xl border border-gray-200 px-4 py-3 space-y-2"
              >
                <p className="text-sm font-medium text-gray-800">It is on the blog</p>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      {...register('permalink')}
                      type="url"
                      placeholder="Permalink (optional)"
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.permalink ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {errors.permalink && (
                      <p className="text-red-500 text-xs mt-1">{errors.permalink.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CircleCheck className="w-3.5 h-3.5" />
                    Mark published
                  </button>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
