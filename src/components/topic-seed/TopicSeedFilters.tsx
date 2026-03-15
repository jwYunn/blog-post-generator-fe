import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { TopicSeedCategory, TopicSeedListParams } from '../../types/topicSeed';

const CATEGORIES: { value: TopicSeedCategory; label: string }[] = [
  { value: 'meaning', label: 'Meaning' },
  { value: 'difference', label: 'Difference' },
  { value: 'example', label: 'Example' },
  { value: 'phrases', label: 'Phrases' },
  { value: 'grammar', label: 'Grammar' },
];

const ACTIVE_FILTERS: { label: string; value: boolean | undefined }[] = [
  { label: '전체', value: undefined },
  { label: '활성', value: true },
  { label: '비활성', value: false },
];

interface Props {
  params: TopicSeedListParams;
  onChange: (filters: Partial<TopicSeedListParams>) => void;
}

export default function TopicSeedFilters({ params, onChange }: Props) {
  const [searchValue, setSearchValue] = useState(params.search ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSearchValue(params.search ?? '');
  }, [params.search]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange({ search: value.trim() || undefined });
    }, 300);
  };

  const clearSearch = () => {
    setSearchValue('');
    clearTimeout(timerRef.current);
    onChange({ search: undefined });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
      {/* 검색 */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Seed 키워드 검색..."
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 카테고리 */}
      <select
        value={params.category ?? ''}
        onChange={(e) =>
          onChange({ category: (e.target.value as TopicSeedCategory) || undefined })
        }
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="">전체 카테고리</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {/* isActive 토글 */}
      <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50 gap-0.5">
        {ACTIVE_FILTERS.map((item) => {
          const isSelected = params.isActive === item.value;
          return (
            <button
              key={item.label}
              onClick={() => onChange({ isActive: item.value })}
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
