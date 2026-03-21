import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ChevronsUpDown } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  publishRecordsApi,
  type CreatePublishRecordPayload,
  type UpdatePublishRecordPayload,
} from '../../api/publishRecords';
import type { PublishRecord } from '../../types/articleDraft';
import type { ArticleDraft } from '../../types/articleDraft';
import { articleDraftApi } from '../../api/articleDrafts';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast';

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const schema = z
  .object({
    draftId: z.string().uuid('Please enter a valid UUID'),
    permalink: z
      .string()
      .url('Please enter a valid URL')
      .or(z.literal(''))
      .optional(),
    scheduleMode: z.enum(['none', 'now', 'schedule']),
    scheduledAt: z.string().optional(),
  })
  .refine(
    (v) => {
      if (v.scheduleMode === 'schedule') {
        return !!v.scheduledAt;
      }
      return true;
    },
    { message: 'Please enter a scheduled time', path: ['scheduledAt'] },
  );

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  /** Pass in edit mode */
  record?: PublishRecord;
  /** Pre-fills draftId when opened from a draft detail page */
  defaultDraftId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converts schedule JSONB → scheduleMode / scheduledAt form values */
function parseSchedule(
  schedule: PublishRecord['schedule'],
): Pick<FormValues, 'scheduleMode' | 'scheduledAt'> {
  if (!schedule) return { scheduleMode: 'none', scheduledAt: '' };
  if (schedule.mode === 'now') return { scheduleMode: 'now', scheduledAt: '' };
  return {
    scheduleMode: 'schedule',
    // datetime-local input expects "YYYY-MM-DDTHH:mm"
    scheduledAt: schedule.scheduledAt.slice(0, 16),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PublishRecordFormModal({
  open,
  record,
  defaultDraftId,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!record;
  const { toasts, addToast, removeToast } = useToast();

  // Combobox state
  const [query, setQuery] = useState('');
  const [selectedDraft, setSelectedDraft] = useState<ArticleDraft | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      draftId: '',
      permalink: '',
      scheduleMode: 'none',
      scheduledAt: '',
    },
  });

  // Fetch all drafts for the combobox
  const { data: draftsData } = useQuery({
    queryKey: ['article-drafts-all'],
    queryFn: () =>
      articleDraftApi.getList({ limit: 200, sortBy: 'createdAt', sortOrder: 'DESC' }),
    staleTime: 60_000,
    enabled: open && !isEdit,
  });

  const allDrafts = draftsData?.data ?? [];

  const filteredDrafts =
    query === ''
      ? allDrafts
      : allDrafts.filter((d) =>
          d.title.toLowerCase().includes(query.toLowerCase()),
        );

  // Reset form whenever the modal opens
  useEffect(() => {
    if (!open) return;
    if (record) {
      reset({
        draftId: record.draftId,
        permalink: record.permalink ?? '',
        ...parseSchedule(record.schedule),
      });
    } else {
      reset({
        draftId: defaultDraftId ?? '',
        permalink: '',
        scheduleMode: 'none',
        scheduledAt: '',
      });
      // Pre-select draft from defaultDraftId if available
      if (defaultDraftId) {
        const match = allDrafts.find((d) => d.id === defaultDraftId) ?? null;
        setSelectedDraft(match);
      } else {
        setSelectedDraft(null);
      }
    }
    setQuery('');
  }, [open, record, defaultDraftId, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const permalink = values.permalink?.trim() || null;

      const schedule: CreatePublishRecordPayload['schedule'] =
        values.scheduleMode === 'now'
          ? { mode: 'now' }
          : values.scheduleMode === 'schedule' && values.scheduledAt
            ? { mode: 'schedule', scheduledAt: new Date(values.scheduledAt).toISOString() }
            : null;

      if (isEdit) {
        const payload: UpdatePublishRecordPayload = { permalink, schedule };
        return publishRecordsApi.update(record!.id, payload);
      } else {
        const payload: CreatePublishRecordPayload = {
          draftId: values.draftId,
          permalink,
          schedule,
        };
        return publishRecordsApi.create(payload);
      }
    },
    onSuccess: () => {
      addToast(isEdit ? 'Publish record updated.' : 'Publish record added.');
      onSuccess();
    },
    onError: () => {
      addToast('Failed to save. Please try again.', 'error');
    },
  });

  const scheduleMode = watch('scheduleMode');

  return (
    <>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />

        {/* Modal container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <DialogTitle className="text-base font-semibold text-gray-900">
                {isEdit ? 'Edit Publish Record' : 'Add Publish Record'}
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={handleSubmit((v) => mutation.mutate(v))}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                {/* Draft */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Draft <span className="text-red-500">*</span>
                  </label>

                  {isEdit ? (
                    /* Edit mode: show draft id (read-only) */
                    <input
                      value={record?.draftId ?? ''}
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono bg-gray-50 text-gray-400"
                    />
                  ) : (
                    /* Create mode: searchable combobox */
                    <Combobox
                      value={selectedDraft}
                      onChange={(draft: ArticleDraft | null) => {
                        setSelectedDraft(draft);
                        setValue('draftId', draft?.id ?? '', { shouldValidate: true });
                        setQuery('');
                      }}
                    >
                      <div className="relative">
                        <ComboboxInput
                          displayValue={(draft: ArticleDraft | null) => draft?.title ?? ''}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search by title…"
                          className={`w-full border rounded-lg px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.draftId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                          <ChevronsUpDown className="w-4 h-4" />
                        </ComboboxButton>
                        <ComboboxOptions className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                          {filteredDrafts.length === 0 ? (
                            <div className="px-4 py-3 text-gray-400">No drafts found.</div>
                          ) : (
                            filteredDrafts.map((draft) => (
                              <ComboboxOption
                                key={draft.id}
                                value={draft}
                                className="px-4 py-2.5 cursor-pointer data-[focus]:bg-blue-50 data-[selected]:bg-blue-50"
                              >
                                <p className="font-medium text-gray-800 truncate">{draft.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{draft.status}</p>
                              </ComboboxOption>
                            ))
                          )}
                        </ComboboxOptions>
                      </div>
                    </Combobox>
                  )}

                  {errors.draftId && (
                    <p className="text-red-500 text-xs mt-1">{errors.draftId.message}</p>
                  )}
                </div>

                {/* Permalink */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Permalink
                  </label>
                  <input
                    {...register('permalink')}
                    type="url"
                    placeholder="https://fromdeepwithin.tistory.com/65"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.permalink ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {errors.permalink && (
                    <p className="text-red-500 text-xs mt-1">{errors.permalink.message}</p>
                  )}
                </div>

                {/* Schedule Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Method
                  </label>
                  <div className="flex gap-4">
                    {(
                      [
                        { value: 'none', label: 'None' },
                        { value: 'now', label: 'Immediate' },
                        { value: 'schedule', label: 'Scheduled' },
                      ] as const
                    ).map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={value}
                          {...register('scheduleMode')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Scheduled time (visible only in schedule mode) */}
                {scheduleMode === 'schedule' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Scheduled Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('scheduledAt')}
                      type="datetime-local"
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.scheduledAt ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {errors.scheduledAt && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.scheduledAt.message}
                      </p>
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
                  type="submit"
                  disabled={mutation.isPending}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-w-[72px]"
                >
                  {mutation.isPending ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving
                    </span>
                  ) : isEdit ? (
                    'Update'
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Toast */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
