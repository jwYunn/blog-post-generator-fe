import type { ArticleOutline } from '../../types/articleDraft';

interface Props {
  outline: ArticleOutline;
}

export default function ArticleDraftOutlineSection({ outline }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <h2 className="text-sm font-semibold text-gray-800">Outline</h2>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Search Intent */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Search Intent
          </p>
          <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            {outline.searchIntent}
          </p>
        </div>

        {/* Sections */}
        {outline.sections.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Sections
            </p>
            <ol className="space-y-2">
              {outline.sections.map((section, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 border border-gray-100 rounded-lg px-4 py-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-800 leading-snug">{section}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* FAQs */}
        {outline.faqs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              FAQs
            </p>
            <ul className="space-y-2">
              {outline.faqs.map((faq, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5"
                >
                  <span className="mt-0.5 text-blue-400 font-semibold flex-shrink-0">Q.</span>
                  {faq}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
