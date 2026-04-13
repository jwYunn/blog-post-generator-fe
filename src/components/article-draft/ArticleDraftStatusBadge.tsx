import type { ArticleDraftStatus } from '../../types/articleDraft';
import { IN_PROGRESS_STATUSES } from '../../types/articleDraft';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ArticleDraftStatus,
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  queued: {
    label: 'Queued',
    dotClass: 'bg-gray-400',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
  },
  generating_outline: {
    label: 'Generating Outline',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
  },
  outline_generated: {
    label: 'Outline Ready',
    dotClass: 'bg-sky-500',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
  },
  generating_content: {
    label: 'Generating Content',
    dotClass: 'bg-purple-500',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
  },
  content_generated: {
    label: 'Content Ready',
    dotClass: 'bg-green-500',
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
  },
  generating_thumbnail: {
    label: 'Generating Thumbnail',
    dotClass: 'bg-orange-500',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
  },
  review_ready: {
    label: 'Review Ready',
    dotClass: 'bg-emerald-600',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
  },
  publishing: {
    label: 'Publishing',
    dotClass: 'bg-purple-500',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
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

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full border border-current border-t-transparent animate-spin ${className ?? ''}`}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  status: ArticleDraftStatus;
  size?: 'sm' | 'md';
}

export default function ArticleDraftStatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status];
  const isInProgress = IN_PROGRESS_STATUSES.includes(status);

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${sizeClass} ${config.bgClass} ${config.textClass}`}
    >
      {isInProgress ? (
        <Spinner />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />
      )}
      {config.label}
    </span>
  );
}
