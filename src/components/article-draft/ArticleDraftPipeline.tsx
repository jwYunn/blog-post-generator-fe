import type { ArticleDraftStatus } from '../../types/articleDraft';

// ─── StepKey (exported for DetailPage) ───────────────────────────────────────

export type StepKey = 'outline' | 'content' | 'thumbnail' | 'review';

/** Where a failed draft stopped: a generation step, or on the way to the blog */
export type FailedStage = 'outline' | 'content' | 'thumbnail' | 'publish';

// ─── Internal types ───────────────────────────────────────────────────────────

type StepState = 'done' | 'active' | 'pending' | 'failed';

interface PipelineStep {
  key: StepKey;
  label: string;
  state: StepState;
}

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'outline',   label: 'Outline'   },
  { key: 'content',   label: 'Content'   },
  { key: 'thumbnail', label: 'Thumbnail' },
  { key: 'review',    label: 'Review'    },
];

const STATUS_TO_STEP_INDEX: Partial<Record<ArticleDraftStatus, number>> = {
  queued:               -1,
  generating_outline:    0,
  outline_generated:     0,
  generating_content:    1,
  content_generated:     1,
  generating_thumbnail:  2,
  review_ready:          3,
  publishing:            3,
  failed:               -2,
};

const ACTIVE_STATUSES: ArticleDraftStatus[] = [
  'generating_outline',
  'generating_content',
  'generating_thumbnail',
];

function buildSteps(status: ArticleDraftStatus, failedStage: FailedStage | null): PipelineStep[] {
  const stepIndex = STATUS_TO_STEP_INDEX[status] ?? -1;
  const isActive  = ACTIVE_STATUSES.includes(status);
  const isFailed  = status === 'failed';
  // A publish failure (or a retry waiting to start) left every step finished
  const failedIndex =
    failedStage === null || failedStage === 'publish'
      ? STEPS.length
      : STEPS.findIndex((step) => step.key === failedStage);

  return STEPS.map(({ key, label }, i) => {
    let state: StepState;

    if (isFailed) {
      state = i < failedIndex ? 'done' : i === failedIndex ? 'failed' : 'pending';
    } else if (i < stepIndex) {
      state = 'done';
    } else if (i === stepIndex) {
      state = isActive ? 'active' : 'done';
    } else {
      state = 'pending';
    }

    // Every generation step is behind a draft that is ready or being published
    if (status === 'review_ready' || status === 'publishing') state = 'done';

    return { key, label, state };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIcon({ state }: { state: StepState }) {
  if (state === 'failed') {
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
  return <span className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />;
}

function Connector({ done }: { done: boolean }) {
  return (
    <div className={`flex-1 h-0.5 mx-1 transition-colors ${done ? 'bg-blue-600' : 'bg-gray-200'}`} />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  status: ArticleDraftStatus;
  /** Only read when status is failed; null means nothing is marked as the failed step */
  failedStage: FailedStage | null;
  selectedStep: StepKey | null;
  availableSteps: StepKey[];
  onSelectStep: (step: StepKey) => void;
}

export default function ArticleDraftPipeline({
  status,
  failedStage,
  selectedStep,
  availableSteps,
  onSelectStep,
}: Props) {
  const steps    = buildSteps(status, failedStage);
  const isFailed = status === 'failed';
  const failedLabel = STEPS.find((step) => step.key === failedStage)?.label;

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
        Pipeline
      </p>

      <div className="flex items-start">
        {steps.map((step, i) => {
          const isAvailable = availableSteps.includes(step.key);
          const isSelected  = selectedStep === step.key;

          return (
            <div key={step.key} className="flex items-start flex-1 last:flex-none">
              {/* Step button */}
              <button
                onClick={() => isAvailable && onSelectStep(step.key)}
                disabled={!isAvailable}
                className={`flex flex-col items-center gap-1.5 group ${
                  isAvailable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Icon */}
                <div
                  className={`transition-transform ${
                    isAvailable && !isSelected ? 'group-hover:scale-110' : ''
                  }`}
                >
                  <StepIcon state={step.state} />
                </div>

                {/* Label */}
                <span
                  className={`text-xs whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'font-semibold text-blue-700'
                      : isAvailable && step.state === 'done'
                        ? 'font-medium text-blue-600 group-hover:text-blue-700'
                        : step.state === 'active'
                          ? 'font-medium text-blue-500'
                          : 'font-medium text-gray-400'
                  }`}
                >
                  {step.label}
                </span>

                {/* Selected indicator */}
                <span
                  className={`w-1 h-1 rounded-full bg-blue-600 transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>

              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="flex-1 pt-2.5 mx-1">
                  <Connector done={step.state === 'done'} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isFailed && failedStage && (
        <p className="mt-3 text-xs text-red-500 text-center">
          {failedStage === 'publish'
            ? 'Article is complete, but publishing failed — see error details below'
            : `Pipeline stopped at ${failedLabel} — see error details below`}
        </p>
      )}
    </div>
  );
}
