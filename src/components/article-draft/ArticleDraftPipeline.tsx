import type { ArticleDraftStatus } from '../../types/articleDraft';

// ─── Pipeline Step Definition ─────────────────────────────────────────────────

type StepState = 'done' | 'active' | 'pending';

interface PipelineStep {
  key: string;
  label: string;
  state: StepState;
}

// Maps draft status → which pipeline step is currently active / done
const STATUS_TO_STEP_INDEX: Partial<Record<ArticleDraftStatus, number>> = {
  // step 0 = Outline, 1 = Content, 2 = Thumbnail, 3 = Review
  queued: -1,              // nothing started yet (all pending)
  generating_outline: 0,   // step 0 active
  outline_generated: 0,    // step 0 done
  generating_content: 1,   // step 1 active
  content_generated: 1,    // step 1 done
  generating_thumbnail: 2, // step 2 active
  review_ready: 3,         // all done (or step 3 done)
  failed: -2,              // show as failed
};

const STEP_LABELS = ['Outline', 'Content', 'Thumbnail', 'Review'];

// Which statuses mark a step as "active" (spinner) vs "done" (filled circle)
const ACTIVE_STATUSES: ArticleDraftStatus[] = [
  'generating_outline',
  'generating_content',
  'generating_thumbnail',
];

function buildSteps(status: ArticleDraftStatus): PipelineStep[] {
  const stepIndex = STATUS_TO_STEP_INDEX[status] ?? -1;
  const isActive = ACTIVE_STATUSES.includes(status);
  const isFailed = status === 'failed';

  return STEP_LABELS.map((label, i) => {
    let state: StepState;

    if (isFailed) {
      state = 'pending';
    } else if (i < stepIndex) {
      state = 'done';
    } else if (i === stepIndex) {
      state = isActive ? 'active' : 'done';
    } else {
      state = 'pending';
    }

    // Special case: review_ready → all steps done
    if (status === 'review_ready') {
      state = 'done';
    }

    return { key: label, label, state };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIcon({ state, failed }: { state: StepState; failed?: boolean }) {
  if (failed) {
    return (
      <span className="w-5 h-5 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center text-red-500 text-[10px] font-bold">
        ✕
      </span>
    );
  }

  if (state === 'done') {
    return (
      <span className="w-5 h-5 rounded-full bg-blue-600 border-2 border-blue-600 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="2,6 5,9 10,3" />
        </svg>
      </span>
    );
  }

  if (state === 'active') {
    return (
      <span className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </span>
    );
  }

  // pending
  return (
    <span className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
  );
}

function Connector({ done }: { done: boolean }) {
  return (
    <div
      className={`flex-1 h-0.5 mx-1 transition-colors ${done ? 'bg-blue-600' : 'bg-gray-200'}`}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  status: ArticleDraftStatus;
}

export default function ArticleDraftPipeline({ status }: Props) {
  const steps = buildSteps(status);
  const isFailed = status === 'failed';

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Pipeline
      </p>

      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step */}
            <div className="flex flex-col items-center gap-1.5">
              <StepIcon state={step.state} failed={isFailed && i === 0} />
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  step.state === 'done'
                    ? 'text-blue-600'
                    : step.state === 'active'
                      ? 'text-blue-500'
                      : isFailed
                        ? 'text-gray-400'
                        : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector (except after last step) */}
            {i < steps.length - 1 && (
              <Connector done={step.state === 'done' && !isFailed} />
            )}
          </div>
        ))}
      </div>

      {isFailed && (
        <p className="mt-3 text-xs text-red-500 text-center">
          Pipeline stopped — see error details below
        </p>
      )}
    </div>
  );
}
