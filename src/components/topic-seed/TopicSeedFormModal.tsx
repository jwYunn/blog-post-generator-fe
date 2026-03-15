import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { topicSeedApi } from '../../api/topicSeed';
import type { TopicSeed, TopicSeedCategory } from '../../types/topicSeed';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const CATEGORIES: { value: TopicSeedCategory; label: string }[] = [
  { value: 'meaning', label: 'Meaning' },
  { value: 'difference', label: 'Difference' },
  { value: 'example', label: 'Example' },
  { value: 'phrases', label: 'Phrases' },
  { value: 'grammar', label: 'Grammar' },
];

// ─── Zod 스키마 ─────────────────────────────────────────────────────────────────

const schema = z.object({
  seed: z
    .string()
    .min(1, 'Required')
    .max(100, 'Max 100 characters'),
  category: z.enum(['meaning', 'difference', 'example', 'phrases', 'grammar'], {
    required_error: 'Please select a category',
  }),
  priority: z
    .number({ invalid_type_error: 'Must be a number' })
    .int('Must be an integer')
    .min(1, 'Minimum 1')
    .max(10, 'Maximum 10'),
  isActive: z.boolean(),
  memo: z.string().max(500, 'Max 500 characters'),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  seed: '',
  category: 'meaning',
  priority: 5,
  isActive: true,
  memo: '',
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  seed?: TopicSeed;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

export default function TopicSeedFormModal({ open, seed, onClose, onSuccess }: Props) {
  const isEdit = !!seed;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (!open) return;
    if (seed) {
      reset({
        seed: seed.seed,
        category: seed.category,
        priority: seed.priority,
        isActive: seed.isActive,
        memo: seed.memo ?? '',
      });
    } else {
      reset(DEFAULT_VALUES);
    }
    setServerError(null);
  }, [open, seed, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        memo: values.memo.trim() || undefined,
      };
      return isEdit
        ? topicSeedApi.update(seed!.id, payload)
        : topicSeedApi.create(payload);
    },
    onSuccess,
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setServerError('This seed already exists');
      } else {
        setServerError('Failed to save. Please try again.');
      }
    },
  });

  const isActive = watch('isActive');
  const memoValue = watch('memo');

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isEdit ? 'Edit Seed' : 'New Seed'}
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
            onSubmit={handleSubmit((v) => {
              setServerError(null);
              mutation.mutate(v);
            })}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              {/* 서버 에러 */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {serverError}
                </div>
              )}

              {/* seed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Seed <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('seed')}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.seed ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="예: run vs jog"
                />
                {errors.seed && (
                  <p className="text-red-500 text-xs mt-1">{errors.seed.message}</p>
                )}
              </div>

              {/* category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category')}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-colors ${
                    errors.category ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority{' '}
                  <span className="text-gray-400 font-normal">(1 ~ 10)</span>
                </label>
                <input
                  {...register('priority', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={10}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.priority ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.priority && (
                  <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>
                )}
              </div>

              {/* isActive 토글 */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-gray-700">Active</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    When inactive, this seed won't be used for generation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('isActive', !isActive, { shouldDirty: true })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label="Toggle active state"
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* memo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Memo</label>
                  <span
                    className={`text-xs ${
                      memoValue.length > 450 ? 'text-orange-500' : 'text-gray-400'
                    }`}
                  >
                    {memoValue.length} / 500
                  </span>
                </div>
                <textarea
                  {...register('memo')}
                  rows={3}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                    errors.memo ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Optional memo"
                />
                {errors.memo && (
                  <p className="text-red-500 text-xs mt-1">{errors.memo.message}</p>
                )}
              </div>
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
                  'Create'
                )}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
