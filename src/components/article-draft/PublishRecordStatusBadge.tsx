import type { PublishRecordStatus } from '../../types/articleDraft';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PublishRecordStatus,
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  attempting: {
    label: 'Attempting',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
  },
  published: {
    label: 'Published',
    dotClass: 'bg-green-500',
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-red-500',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublishRecordStatusBadge({ status }: { status: PublishRecordStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
