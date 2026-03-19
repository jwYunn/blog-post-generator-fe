import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  hashtags: string[] | null;
}

export default function HashtagsSection({ hashtags }: Props) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  if (!hashtags || hashtags.length === 0) return null;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(hashtags.map((t) => t.replace(/^#/, '')).join('\t'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const handleCopyTag = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag.replace(/^#/, ''));
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <h2 className="text-sm font-semibold text-gray-800">Hashtags</h2>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Copy all hashtags as a single line"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy All
            </>
          )}
        </button>
      </div>

      {/* Pills */}
      <div className="px-6 py-4 flex flex-wrap gap-2">
        {hashtags.map((tag) => {
          const isCopied = copiedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => handleCopyTag(tag)}
              title={`Copy ${tag}`}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                isCopied
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-200'
              }`}
            >
              {isCopied ? <Check className="w-3 h-3" /> : null}
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
