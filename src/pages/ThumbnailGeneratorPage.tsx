import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ImageIcon, Sparkles, Loader2, X, ChevronDown, ChevronUp,
  CheckCircle, Trash2, Eye, AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import { thumbnailGeneratorApi } from '../api/thumbnailGenerator';
import type { GenerateThumbnailRequest, ThumbnailPromptMapping } from '../types/thumbnail';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 120_000;

const MODEL_OPTIONS = [
  { value: 'black-forest-labs/flux-schnell', label: 'FLUX Schnell (fast · $0.003)' },
  { value: 'black-forest-labs/flux-dev',     label: 'FLUX Dev (quality · $0.025)' },
];

const ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9 — Landscape (blog)' },
  { value: '4:3',  label: '4:3 — Standard' },
  { value: '1:1',  label: '1:1 — Square' },
  { value: '3:2',  label: '3:2 — Photo' },
  { value: '21:9', label: '21:9 — Ultrawide' },
];

const FORMAT_OPTIONS = [
  { value: 'webp', label: 'WebP (recommended)' },
  { value: 'jpg',  label: 'JPG' },
  { value: 'png',  label: 'PNG' },
];

const STATUS_STYLES = {
  generating: 'bg-yellow-100 text-yellow-700',
  done:       'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-600',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({
  mapping,
  onToggleActive,
  isToggling,
}: {
  mapping: ThumbnailPromptMapping;
  onToggleActive: (mappingId: string, active: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
        mapping.active
          ? 'border-green-500 shadow-lg shadow-green-100'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <img
        src={mapping.thumbnail.url}
        alt={`Thumbnail #${mapping.rank ?? ''}`}
        className="w-full aspect-video object-cover bg-gray-100"
        loading="lazy"
      />
      {/* Active badge */}
      {mapping.active && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow">
          <CheckCircle className="w-3 h-3" />
          Active
        </div>
      )}
      {/* Rank badge */}
      {mapping.rank && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center">
          {mapping.rank}
        </div>
      )}
      {/* Footer */}
      <div className="p-2.5 flex items-center justify-between bg-white border-t border-gray-100">
        <span className="text-xs text-gray-400 truncate">
          {mapping.thumbnail.mimeType ?? 'image'}
        </span>
        <button
          onClick={() => onToggleActive(mapping.id, !mapping.active)}
          disabled={isToggling}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            mapping.active
              ? 'text-green-700 bg-green-50 hover:bg-green-100'
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {isToggling ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          {mapping.active ? 'Deactivate' : 'Use'}
        </button>
      </div>
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({
  prompt,
  isActive,
  onView,
  onDelete,
  isDeleting,
}: {
  prompt: { id: string; name: string | null; prompt: string; model: string; status: string; createdAt: string };
  isActive: boolean;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const modelLabel = prompt.model.split('/')[1] ?? prompt.model;

  return (
    <tr className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${isActive ? 'bg-blue-50/40' : ''}`}>
      <td className="px-4 py-3 max-w-[280px]">
        {prompt.name && (
          <p className="text-xs font-semibold text-gray-700 mb-0.5 truncate">{prompt.name}</p>
        )}
        <p className="text-xs text-gray-500 truncate" title={prompt.prompt}>
          {prompt.prompt}
        </p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[prompt.status as keyof typeof STATUS_STYLES] ?? 'bg-gray-100 text-gray-500'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {prompt.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{modelLabel}</td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(prompt.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onView(prompt.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            disabled={isDeleting}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function ThumbnailGeneratorPage() {
  const queryClient = useQueryClient();
  const { toasts, addToast, removeToast } = useToast();

  const [showOptions, setShowOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [viewImages, setViewImages] = useState<ThumbnailPromptMapping[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<GenerateThumbnailRequest>({
    defaultValues: {
      model: 'black-forest-labs/flux-schnell',
      aspect_ratio: '16:9',
      output_format: 'webp',
      num_outputs: 1,
      output_quality: 85,
    },
  });

  // ─── 히스토리 목록 ──────────────────────────────────────────────────────────
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['thumbnail-prompts'],
    queryFn: () => thumbnailGeneratorApi.getPrompts(1, 30),
    staleTime: 10_000,
  });

  // ─── 폴링: prompt status ────────────────────────────────────────────────────
  const { data: polledPrompt } = useQuery({
    queryKey: ['thumbnail-prompt', activePromptId],
    queryFn: () => thumbnailGeneratorApi.getPrompt(activePromptId!),
    enabled: !!activePromptId && isGenerating,
    refetchInterval: isGenerating ? POLL_INTERVAL_MS : false,
  });

  // status 변경 감지 → 완료 처리
  useEffect(() => {
    if (!isGenerating || !polledPrompt) return;

    if (polledPrompt.status === 'done') {
      stopPolling();
      loadImages(polledPrompt.id);
      queryClient.invalidateQueries({ queryKey: ['thumbnail-prompts'] });
      addToast('Thumbnail generated!', 'success');
    } else if (polledPrompt.status === 'failed') {
      stopPolling();
      queryClient.invalidateQueries({ queryKey: ['thumbnail-prompts'] });
      addToast('Thumbnail generation failed.', 'error');
    }
  }, [polledPrompt?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); };
  }, []);

  const stopPolling = () => {
    setIsGenerating(false);
    if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
  };

  // ─── 이미지 로드 ─────────────────────────────────────────────────────────────
  const loadImages = async (promptId: string) => {
    try {
      const images = await thumbnailGeneratorApi.getImages(promptId);
      setViewImages(images);
      setActivePromptId(promptId);
    } catch {
      addToast('Failed to load images.', 'error');
    }
  };

  // ─── Generate mutation ───────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: (dto: GenerateThumbnailRequest) => thumbnailGeneratorApi.generate(dto),
    onSuccess: (prompt) => {
      setActivePromptId(prompt.id);
      setViewImages([]);
      setIsGenerating(true);
      queryClient.invalidateQueries({ queryKey: ['thumbnail-prompts'] });

      pollTimeoutRef.current = setTimeout(() => {
        setIsGenerating(false);
        addToast('Generation is taking longer than expected.', 'error');
      }, POLL_TIMEOUT_MS);
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to start generation.')
        : 'Failed to start generation.';
      addToast(message, 'error');
    },
  });

  // ─── Active 토글 ─────────────────────────────────────────────────────────────
  const handleToggleActive = async (mappingId: string, active: boolean) => {
    setTogglingId(mappingId);
    try {
      const updated = await thumbnailGeneratorApi.setActive(mappingId, active);
      setViewImages((prev) =>
        prev.map((m) => (m.id === mappingId ? { ...m, active: updated.active } : m)),
      );
    } catch {
      addToast('Failed to update active status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Delete mutation ─────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => thumbnailGeneratorApi.deletePrompt(id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['thumbnail-prompts'] });
      if (activePromptId === deletedId) { setActivePromptId(null); setViewImages([]); }
      addToast('Prompt deleted.', 'success');
    },
    onError: () => addToast('Failed to delete prompt.', 'error'),
  });

  const onSubmit = (dto: GenerateThumbnailRequest) => {
    generateMutation.mutate(dto);
  };

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* 페이지 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-violet-500" />
              Thumbnail Generator
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Generate blog thumbnails using AI image models
            </p>
          </div>
        </div>

        {/* ─── 생성 폼 ─────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

          {/* Prompt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register('prompt', { required: 'Prompt is required.' })}
              rows={4}
              placeholder="e.g. A clean, modern blog thumbnail for an English learning article about 'custom vs customs', flat design, light purple and white tones, minimalist typography..."
              className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none placeholder:text-gray-300"
            />
            {errors.prompt && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.prompt.message}
              </p>
            )}
          </div>

          {/* Name (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Name <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Custom vs Customs — purple theme"
              className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-300"
            />
          </div>

          {/* Options toggle */}
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Options
          </button>

          {showOptions && (
            <div className="grid grid-cols-2 gap-4 pt-1 md:grid-cols-3">
              {/* Model */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Model</label>
                <select
                  {...register('model')}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                >
                  {MODEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Aspect Ratio</label>
                <select
                  {...register('aspect_ratio')}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                >
                  {ASPECT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Format</label>
                <select
                  {...register('output_format')}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                >
                  {FORMAT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Num Outputs */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Num Outputs <span className="font-normal text-gray-400">(1–4)</span>
                </label>
                <input
                  {...register('num_outputs', { valueAsNumber: true, min: 1, max: 4 })}
                  type="number"
                  min={1}
                  max={4}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              {/* Quality */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Output Quality <span className="font-normal text-gray-400">(0–100)</span>
                </label>
                <input
                  {...register('output_quality', { valueAsNumber: true, min: 0, max: 100 })}
                  type="number"
                  min={0}
                  max={100}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isGenerating || generateMutation.isPending}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ${
                isGenerating || generateMutation.isPending
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800'
              }`}
            >
              {isGenerating || generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </form>

        {/* ─── 폴링 배너 ───────────────────────────────────────────────────────── */}
        {isGenerating && (
          <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
            <Loader2 className="w-4 h-4 text-violet-500 animate-spin shrink-0" />
            <p className="text-sm text-violet-700 font-medium">
              Generating thumbnail with AI — polling every 3 seconds…
            </p>
            <button
              onClick={stopPolling}
              className="ml-auto p-1 text-violet-300 hover:text-violet-600 hover:bg-violet-100 rounded-md transition-colors shrink-0"
              title="Cancel polling"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ─── 생성된 이미지 ───────────────────────────────────────────────────── */}
        {viewImages.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-gray-700">Generated Images</h2>
              <span className="text-xs text-gray-400">{viewImages.length} image{viewImages.length > 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {viewImages.map((mapping) => (
                <ImageCard
                  key={mapping.id}
                  mapping={mapping}
                  onToggleActive={handleToggleActive}
                  isToggling={togglingId === mapping.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── 히스토리 테이블 ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">History</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {['Prompt', 'Status', 'Model', 'Created', ''].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isHistoryLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {['40%', '12%', '15%', '15%', '10%'].map((w, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (historyData?.data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-10 h-10 text-gray-200" />
                          <p className="text-sm text-gray-400">No thumbnails generated yet</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    (historyData?.data ?? []).map((prompt) => (
                      <HistoryRow
                        key={prompt.id}
                        prompt={prompt}
                        isActive={prompt.id === activePromptId}
                        onView={loadImages}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        isDeleting={deletingId === prompt.id}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
