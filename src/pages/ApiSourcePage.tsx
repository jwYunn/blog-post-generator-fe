import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Plus, Pencil, Trash2, ExternalLink, X } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { apiSourceApi } from '../api/apiSource';
import type { ApiSource, ApiSourceFormValues } from '../types/apiSource';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  const widths = ['20%', '45%', '30%', '10%'];
  return (
    <tr className="border-b border-gray-50">
      {widths.map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="animate-pulse bg-gray-100 rounded h-4" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  source,
  onConfirm,
  onCancel,
  isPending,
}: {
  source: ApiSource;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <DialogTitle className="text-base font-semibold text-gray-900 mb-2">
            Delete API Source
          </DialogTitle>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete{' '}
            <span className="font-medium text-gray-700">{source.name}</span>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function ApiSourceFormModal({
  source,
  onClose,
}: {
  source: ApiSource | null; // null = create
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApiSourceFormValues>({
    defaultValues: source
      ? { name: source.name, url: source.url }
      : { name: '', url: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: ApiSourceFormValues) =>
      source
        ? apiSourceApi.update(source.id, values)
        : apiSourceApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-sources'] });
      addToast(source ? 'Updated successfully.' : 'Created successfully.', 'success');
      onClose();
    },
    onError: () => {
      addToast('Something went wrong. Please try again.', 'error');
    },
  });

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <DialogTitle className="text-base font-semibold text-gray-900">
              {source ? 'Edit API Source' : 'Add API Source'}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="px-6 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g. OpenAI"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">URL</label>
              <input
                {...register('url', { required: 'URL is required' })}
                placeholder="e.g. https://platform.openai.com/settings/organization/billing/overview"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
              {errors.url && (
                <p className="mt-1 text-xs text-red-500">{errors.url.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {mutation.isPending ? 'Saving…' : source ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApiSourcePage() {
  const queryClient = useQueryClient();
  const { toasts, addToast, removeToast } = useToast();

  const [formTarget, setFormTarget] = useState<ApiSource | null | undefined>(undefined);
  // undefined = closed, null = create mode, ApiSource = edit mode
  const [deleteTarget, setDeleteTarget] = useState<ApiSource | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['api-sources'],
    queryFn: apiSourceApi.getList,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiSourceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-sources'] });
      addToast('Deleted successfully.', 'success');
      setDeleteTarget(null);
    },
    onError: () => {
      addToast('Failed to delete. Please try again.', 'error');
    },
  });

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">API Sources</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isLoading ? '' : `${data?.length ?? 0} source${(data?.length ?? 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setFormTarget(null)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Source
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Name', 'URL', 'Created', ''].map((h, i) => (
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : isError ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-gray-500 text-sm">Failed to load data</p>
                        <button
                          onClick={() => refetch()}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (data?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Database className="w-8 h-8 text-gray-200" />
                        <p className="text-gray-500 text-sm mt-1">No API sources yet</p>
                        <p className="text-gray-400 text-xs">Click "Add Source" to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data!.map((source) => (
                    <tr key={source.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-900">{source.name}</span>
                      </td>

                      {/* URL */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          title={source.url}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline truncate max-w-full"
                        >
                          <span className="truncate">{stripProtocol(source.url)}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(source.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity justify-end">
                          <button
                            onClick={() => setFormTarget(source)}
                            title="Edit"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(source)}
                            title="Delete"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Form Modal (create / edit) */}
      {formTarget !== undefined && (
        <ApiSourceFormModal source={formTarget} onClose={() => setFormTarget(undefined)} />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmDialog
          source={deleteTarget}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
