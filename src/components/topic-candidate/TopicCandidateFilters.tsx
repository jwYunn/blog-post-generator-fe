import type { TopicCandidateListParams, TopicCandidateStatus } from '../../types/topicCandidate';
import type { TopicSeed } from '../../types/topicSeed';

const STATUS_FILTERS: { label: string; value: TopicCandidateStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

interface Props {
  params: TopicCandidateListParams;
  seeds: TopicSeed[];
  onChange: (filters: Partial<TopicCandidateListParams>) => void;
}

export default function TopicCandidateFilters({ params, seeds, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
      {/* Seed dropdown */}
      <select
        value={params.topicSeedId ?? ''}
        onChange={(e) => onChange({ topicSeedId: e.target.value || undefined })}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[180px]"
      >
        <option value="">All seeds</option>
        {seeds.map((s) => (
          <option key={s.id} value={s.id}>
            {s.seed}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50 gap-0.5">
        {STATUS_FILTERS.map((item) => {
          const isSelected = params.status === item.value;
          return (
            <button
              key={item.label}
              onClick={() => onChange({ status: item.value })}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                isSelected
                  ? 'bg-white text-gray-900 font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
