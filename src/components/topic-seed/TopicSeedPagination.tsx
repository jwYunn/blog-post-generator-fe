import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  total: number;
  page: number;
  limit: number;
  onChange: (page: number, limit: number) => void;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}

export default function TopicSeedPagination({ total, page, limit, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pages = getPageNumbers(page, totalPages);

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
      {/* 좌측: 결과 정보 + 페이지당 개수 */}
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>
          {total === 0 ? '0 results' : `${from.toLocaleString()} – ${to.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        <span className="text-gray-300">|</span>
        <label className="flex items-center gap-1.5">
          Per page
          <select
            value={limit}
            onChange={(e) => onChange(1, Number(e.target.value))}
            className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 우측: 페이지 네비게이션 */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* 이전 */}
          <button
            onClick={() => onChange(page - 1, limit)}
            disabled={page === 1}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 페이지 번호 */}
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="w-8 text-center text-gray-400 text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number, limit)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  p === page
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ),
          )}

          {/* 다음 */}
          <button
            onClick={() => onChange(page + 1, limit)}
            disabled={page === totalPages}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
