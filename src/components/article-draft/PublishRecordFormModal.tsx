import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import {
  publishRecordsApi,
  type CreatePublishRecordPayload,
  type UpdatePublishRecordPayload,
} from '../../api/publishRecords';
import type { PublishRecord } from '../../types/articleDraft';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast';

// ─── Zod 스키마 ──────────────────────────────────────────────────────────────

const schema = z
  .object({
    draftId: z.string().uuid('유효한 UUID를 입력해주세요'),
    permalink: z
      .string()
      .url('유효한 URL을 입력해주세요')
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
    { message: '예약 시간을 입력해주세요', path: ['scheduledAt'] },
  );

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  /** 수정 모드일 때 전달 */
  record?: PublishRecord;
  /** 생성 모드에서 draft 페이지에서 열 때 draftId를 미리 채워넣음 */
  defaultDraftId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

/** schedule JSONB → scheduleMode, scheduledAt 변환 */
function parseSchedule(
  schedule: PublishRecord['schedule'],
): Pick<FormValues, 'scheduleMode' | 'scheduledAt'> {
  if (!schedule) return { scheduleMode: 'none', scheduledAt: '' };
  if (schedule.mode === 'now') return { scheduleMode: 'now', scheduledAt: '' };
  return {
    scheduleMode: 'schedule',
    // datetime-local input은 "YYYY-MM-DDTHH:mm" 형식 필요
    scheduledAt: schedule.scheduledAt.slice(0, 16),
  };
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function PublishRecordFormModal({
  open,
  record,
  defaultDraftId,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!record;
  const { toasts, addToast, removeToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
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

  // 모달이 열릴 때마다 폼 초기화
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
    }
  }, [open, record, defaultDraftId, reset]);

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
      addToast(isEdit ? '발행 내역이 수정되었습니다.' : '발행 내역이 추가되었습니다.');
      onSuccess();
    },
    onError: () => {
      addToast('저장에 실패했습니다. 다시 시도해주세요.', 'error');
    },
  });

  const scheduleMode = watch('scheduleMode');

  return (
    <>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        {/* 배경 오버레이 */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />

        {/* 모달 컨테이너 */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <DialogTitle className="text-base font-semibold text-gray-900">
                {isEdit ? '발행 내역 수정' : '발행 내역 추가'}
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 바디 */}
            <form
              onSubmit={handleSubmit((v) => mutation.mutate(v))}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                {/* Draft ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Draft ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('draftId')}
                    disabled={isEdit}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-400 ${
                      errors.draftId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
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
                    발행 방식
                  </label>
                  <div className="flex gap-4">
                    {(
                      [
                        { value: 'none', label: '없음' },
                        { value: 'now', label: '즉시 발행' },
                        { value: 'schedule', label: '예약 발행' },
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

                {/* 예약 시간 입력 (schedule 모드일 때만) */}
                {scheduleMode === 'schedule' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      예약 시간 <span className="text-red-500">*</span>
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

              {/* 푸터 */}
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

      {/* 토스트 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
