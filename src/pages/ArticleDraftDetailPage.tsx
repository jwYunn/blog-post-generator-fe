import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, RefreshCw, Copy, Check, ExternalLink, Send, Sprout, ChevronRight } from 'lucide-react';
import { articleDraftApi } from '../api/articleDrafts';
import { IN_PROGRESS_STATUSES, isAttemptInFlight } from '../types/articleDraft';
import type { ArticleDraft, PublishRecord } from '../types/articleDraft';
import ArticleDraftStatusBadge from '../components/article-draft/ArticleDraftStatusBadge';
import ArticleDraftPipeline from '../components/article-draft/ArticleDraftPipeline';
import type { FailedStage, StepKey } from '../components/article-draft/ArticleDraftPipeline';
import ArticleDraftOutlineSection from '../components/article-draft/ArticleDraftOutlineSection';
import ArticleDraftContentSection from '../components/article-draft/ArticleDraftContentSection';
import HashtagsSection from '../components/article-draft/HashtagsSection';
import PublishModal from '../components/article-draft/PublishModal';
import PublishRecordStatusBadge from '../components/article-draft/PublishRecordStatusBadge';
import ResolveAttemptDialog from '../components/article-draft/ResolveAttemptDialog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3_000;

/**
 * Where a failed draft stopped. Attempt records only exist once Publish was
 * pressed, so a failed draft that has one failed on its way to the blog; any
 * other failure is the first generation step that left nothing behind.
 */
function getFailedStage(draft: ArticleDraft, hasPublishRecords: boolean): FailedStage | null {
  if (draft.status !== 'failed') return null;
  if (hasPublishRecords) return 'publish';
  if (!draft.outline) return 'outline';
  if (!draft.content) return 'content';
  return 'thumbnail';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Publish Records Section ──────────────────────────────────────────────────

function PublishRecordsSection({
  records,
  draft,
  onResolve,
}: {
  records: PublishRecord[];
  draft: ArticleDraft;
  onResolve: (record: PublishRecord) => void;
}) {
  if (records.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <Send className="w-4 h-4 text-green-600" />
        <h2 className="text-sm font-semibold text-gray-800">Publish Records</h2>
        <span className="text-xs text-gray-400 tabular-nums">{records.length}</span>
      </div>
      <ul className="divide-y divide-gray-50">
        {records.map((rec) => (
          <li key={rec.id} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              {/* Permalink */}
              <div className="flex-1 min-w-0">
                {rec.permalink ? (
                  <a
                    href={rec.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-full"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{rec.permalink}</span>
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">–</span>
                )}

                {/* Schedule 정보 */}
                {rec.schedule && (
                  <p className="text-xs text-gray-400 mt-1">
                    {rec.schedule.mode === 'now'
                      ? 'Immediate'
                      : `Scheduled · ${formatDate(rec.schedule.scheduledAt)}`}
                  </p>
                )}
              </div>

              {/* Status + createdAt */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {rec.status === 'attempting' && !isAttemptInFlight(rec, draft) && (
                    <button
                      onClick={() => onResolve(rec)}
                      className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                  <PublishRecordStatusBadge status={rec.status} />
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(rec.createdAt)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Title with copy button ────────────────────────────────────────────────────

function TitleWithCopy({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="flex items-start gap-2">
      <h1 className="min-w-0 break-words text-lg font-bold text-gray-900 leading-snug">{title}</h1>
      <button
        onClick={handleCopy}
        title="Copy title"
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Where the draft came from. The candidate title stays alongside the seed
// because generation may have rewritten the draft's own title since.
function DraftSource({ candidate }: { candidate: NonNullable<ArticleDraft['topicCandidate']> }) {
  return (
    <div className="flex items-center gap-1.5 mt-2 min-w-0 text-xs text-gray-400">
      <Link
        to={`/topic-candidates?seedId=${candidate.topicSeedId}`}
        title="Show this seed's candidates"
        className="flex-shrink-0 inline-flex items-center gap-1 font-medium text-gray-500 hover:text-blue-600 transition-colors"
      >
        <Sprout className="w-3.5 h-3.5" />
        {candidate.topicSeed.seed}
      </Link>
      <ChevronRight className="w-3 h-3 flex-shrink-0" />
      <span className="truncate" title={candidate.title}>{candidate.title}</span>
    </div>
  );
}

// ─── Thumbnail view (Thumbnail 단계 선택 시) ──────────────────────────────────

function ThumbnailView({ url }: { url: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <h2 className="text-sm font-semibold text-gray-800">Thumbnail</h2>
      </div>
      <div className="p-8 flex items-center justify-center bg-gray-50/50">
        <img
          src={url}
          alt="Article thumbnail"
          className="max-w-full max-h-96 rounded-xl shadow-sm object-contain"
        />
      </div>
    </div>
  );
}

// ─── In-progress placeholder ──────────────────────────────────────────────────

function GeneratingPlaceholder() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Generating…</p>
        <p className="text-xs text-gray-400">This page refreshes automatically every 3 seconds</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-8">
        <div className="flex items-start gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-200" />
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
              {i < 4 && <div className="flex-1 pt-2.5 mx-1"><div className="h-0.5 bg-gray-100" /></div>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-2">
        {[80, 65, 70, 55, 75].map((w, i) => (
          <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Step content renderer ────────────────────────────────────────────────────

function StepContent({
  draft,
  selectedStep,
  isInProgress,
}: {
  draft: ArticleDraft;
  selectedStep: StepKey | null;
  isInProgress: boolean;
}) {
  // 선택된 단계가 없으면 진행 중 스피너 또는 아무것도 표시 안 함
  if (!selectedStep) {
    return isInProgress ? <GeneratingPlaceholder /> : null;
  }

  switch (selectedStep) {
    case 'outline':
      return draft.outline ? (
        <ArticleDraftOutlineSection outline={draft.outline} />
      ) : (
        isInProgress ? <GeneratingPlaceholder /> : null
      );

    case 'content':
      return draft.content ? (
        // Content 단: hashtags → 토글 O, Copy X
        <div className="space-y-4">
          <HashtagsSection hashtags={draft.hashtags} />
          <ArticleDraftContentSection
            content={draft.content}
            label="Content"
            showCopy={false}
          />
        </div>
      ) : (
        isInProgress ? <GeneratingPlaceholder /> : null
      );

    case 'thumbnail':
      return draft.thumbnailImageUrl ? (
        <ThumbnailView url={draft.thumbnailImageUrl} />
      ) : (
        isInProgress ? <GeneratingPlaceholder /> : null
      );

    case 'review':
      // Review 단: hashtags → 썸네일 + 마크다운, 토글 O, Copy O
      return draft.content ? (
        <div className="space-y-4">
          <HashtagsSection hashtags={draft.hashtags} />
          <ArticleDraftContentSection
            content={draft.content}
            label="Review"
            showCopy={true}
            thumbnailImageUrl={draft.thumbnailImageUrl}
          />
        </div>
      ) : null;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArticleDraftDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedStep, setSelectedStep] = useState<StepKey | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<PublishRecord | null>(null);

  // Every attempt, not only successful ones. A publish request leaves the draft
  // at review_ready until the worker picks it up, so the attempt record is the
  // only sign that one is under way - and an attempt that never reported back
  // is what blocks the next publish.
  const { data: publishRecordsData, isPending: publishRecordsPending } = useQuery({
    queryKey: ['article-draft-publish-records', id],
    queryFn:  () => articleDraftApi.getPublishRecords(id!),
    enabled:  !!id,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const cachedDraft = queryClient.getQueryData<ArticleDraft>(['article-draft', id]);
      return isAttemptInFlight(query.state.data?.data[0], cachedDraft) ? POLL_INTERVAL_MS : false;
    },
  });
  const publishRecords: PublishRecord[] = publishRecordsData?.data ?? [];
  const latestRecord = publishRecords[0];

  const { data: draft, isLoading, isError, refetch } = useQuery({
    queryKey: ['article-draft', id],
    queryFn:  () => articleDraftApi.getOne(id!),
    enabled:  !!id,
    refetchInterval: (query) => {
      const current = query.state.data;
      if (!current) return false;
      return IN_PROGRESS_STATUSES.includes(current.status) || isAttemptInFlight(latestRecord, current)
        ? POLL_INTERVAL_MS
        : false;
    },
  });

  // 현재 데이터가 있는 단계 목록
  const failedStage = draft ? getFailedStage(draft, publishRecords.length > 0) : null;

  const availableSteps = useMemo<StepKey[]>(() => {
    if (!draft) return [];
    const steps: StepKey[] = [];
    if (draft.outline)            steps.push('outline');
    if (draft.content)            steps.push('content');
    if (draft.thumbnailImageUrl)  steps.push('thumbnail');
    // Publishing works from the finished article, so it stays reviewable
    if (
      draft.status === 'review_ready' ||
      draft.status === 'publishing' ||
      failedStage === 'publish'
    ) {
      steps.push('review');
    }
    return steps;
  }, [draft, failedStage]);

  // 새 단계가 생기면 가장 앞선 단계로 자동 이동 (이미 선택한 게 유효하면 유지)
  useEffect(() => {
    if (availableSteps.length === 0) return;
    setSelectedStep((prev) => {
      if (prev && availableSteps.includes(prev)) return prev;
      return availableSteps[availableSteps.length - 1];
    });
  }, [availableSteps]);

  // ─── Error state ─────────────────────────────────────────────────────────
  if (isError) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <BackButton onClick={() => navigate('/article-drafts')} />
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-gray-600 font-medium">Failed to load draft</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (isLoading || !draft) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <BackButton onClick={() => navigate('/article-drafts')} />
        <DetailSkeleton />
      </main>
    );
  }

  const isInProgress = IN_PROGRESS_STATUSES.includes(draft.status);

  // The server refuses a new publish while any attempt is live or unresolved.
  // Waiting for the records keeps the button from flashing up and then 409ing.
  const hasBlockingRecord = publishRecords.some((r) => r.status !== 'failed');
  // A publish that failed before posting can be retried from the same article;
  // a draft that failed while being written has nothing to publish
  const isPublishRetry = failedStage === 'publish' && !!draft.content;
  const canPublish =
    (draft.status === 'review_ready' || isPublishRetry) &&
    !publishRecordsPending &&
    !hasBlockingRecord;
  // Requested, but the worker has not moved the draft to "publishing" yet
  const isPublishQueued =
    (draft.status === 'review_ready' || draft.status === 'failed') &&
    isAttemptInFlight(latestRecord, draft);
  // An attempt nobody is going to resolve but a person
  const stuckAttempt = publishRecords.find(
    (r) => r.status === 'attempting' && !isAttemptInFlight(r, draft),
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className={`max-w-4xl mx-auto px-4 sm:px-8 py-8 ${canPublish ? 'pb-28 sm:pb-8' : ''}`}>
      <BackButton onClick={() => navigate('/article-drafts')} />

      <div className="space-y-4">
        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex-1 min-w-0">
              <TitleWithCopy title={draft.title} />
              <p className="text-sm text-gray-400 mt-1">{draft.keyword}</p>
              {draft.topicCandidate && <DraftSource candidate={draft.topicCandidate} />}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* On mobile the Publish action lives in the sticky bottom bar instead */}
              {canPublish && (
                <button
                  onClick={() => setPublishModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isPublishRetry ? 'Retry Publish' : 'Publish'}
                </button>
              )}
              <ArticleDraftStatusBadge status={draft.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
            <span>Created: {formatDate(draft.createdAt)}</span>
            <span className="hidden sm:inline">·</span>
            <span>Updated: {formatDate(draft.updatedAt)}</span>
          </div>

          {(isInProgress || isPublishQueued) && (
            <div className="flex items-center gap-2 mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
              <span className="text-xs text-blue-600">
                {isPublishQueued
                  ? 'Publish requested — waiting for the publisher to start. Page will update automatically'
                  : 'Processing in progress — page will update automatically'}
              </span>
            </div>
          )}
        </div>

        {/* ── Unresolved attempt: the one thing blocking a republish ─────── */}
        {stuckAttempt && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                A publish attempt never reported back
              </p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                The post may or may not be on the blog. Publishing again stays blocked
                until you check the blog and resolve the attempt.
              </p>
            </div>
            <button
              onClick={() => setResolveTarget(stuckAttempt)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Resolve
            </button>
          </div>
        )}

        {/* ── published 상태가 아닐 때만 Pipeline / StepContent 표시 ──────── */}
        {draft.status !== 'published' && (
          <>
            {/* ── Pipeline (클릭 가능) ──────────────────────────────────────── */}
            <ArticleDraftPipeline
              status={draft.status}
              failedStage={isPublishQueued ? null : failedStage}
              selectedStep={selectedStep}
              availableSteps={availableSteps}
              onSelectStep={setSelectedStep}
            />

            {/* ── Error section (failed 일 때만) ────────────────────────────── */}
            {draft.status === 'failed' && draft.errorMessage && !isPublishQueued && (
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <h2 className="text-sm font-semibold text-red-700">
                    {failedStage === 'publish' ? 'Publish Error' : 'Generation Error'}
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-red-600 leading-relaxed">{draft.errorMessage}</p>
                </div>
              </div>
            )}

            {/* ── 선택된 단계의 콘텐츠 ──────────────────────────────────────── */}
            <StepContent
              draft={draft}
              selectedStep={selectedStep}
              isInProgress={isInProgress}
            />
          </>
        )}

        {/* ── Publish Records (every attempt, whatever the draft status) ──── */}
        <PublishRecordsSection
          records={publishRecords}
          draft={draft}
          onResolve={setResolveTarget}
        />
      </div>

      {/* ── Mobile sticky Publish bar ───────────────────────────────────── */}
      {canPublish && (
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => setPublishModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isPublishRetry ? 'Retry Publish' : 'Publish'}
          </button>
        </div>
      )}

      <ResolveAttemptDialog
        record={resolveTarget}
        draftTitle={draft.title}
        onClose={() => setResolveTarget(null)}
        onResolved={() => {
          setResolveTarget(null);
          queryClient.invalidateQueries({ queryKey: ['article-draft-publish-records', id] });
          queryClient.invalidateQueries({ queryKey: ['publish-records'] });
        }}
      />

      {/* Publish Modal */}
      <PublishModal
        open={publishModalOpen}
        draftId={draft.id}
        draftTitle={draft.title}
        onClose={() => setPublishModalOpen(false)}
        onSuccess={() => {
          setPublishModalOpen(false);
          // The new attempt record is what starts polling while the draft
          // still reads review_ready, so both have to be refetched
          queryClient.invalidateQueries({ queryKey: ['article-draft', id] });
          queryClient.invalidateQueries({ queryKey: ['article-draft-publish-records', id] });
        }}
      />
    </main>
  );
}

// ─── BackButton helper ────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Article Drafts
    </button>
  );
}
