import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import { Copy, Check } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  content: string;
  label?: string;                     // 헤더 제목, 기본값: 'Content'
  showCopy?: boolean;                 // Review 단계에서만 true
  thumbnailImageUrl?: string | null;  // Preview 모드 상단 썸네일 (Review 전용)
}

// ─── View mode ────────────────────────────────────────────────────────────────

type ViewMode = 'preview' | 'markdown' | 'html';

// ─── Markdown Preview ─────────────────────────────────────────────────────────

function MarkdownPreview({
  content,
  thumbnailImageUrl,
}: {
  content: string;
  thumbnailImageUrl?: string | null;
}) {
  return (
    <div className="px-6 py-5">
      {thumbnailImageUrl && (
        <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
          <img
            src={thumbnailImageUrl}
            alt="Article thumbnail"
            className="max-w-full max-h-72 object-contain"
          />
        </div>
      )}
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-gray-800 mt-7 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-gray-700 leading-7 mb-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-gray-700 leading-6 pl-1">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-200 pl-4 my-4 text-sm text-gray-600 italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = !!className;
            return isBlock ? (
              <code className="block bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm font-mono text-gray-800 overflow-x-auto my-3 whitespace-pre">
                {children}
              </code>
            ) : (
              <code className="bg-gray-100 text-gray-800 text-xs font-mono px-1.5 py-0.5 rounded">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-sm text-gray-700 border-b border-gray-100">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-gray-100" />,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Source view (Markdown / HTML 탭) ─────────────────────────────────────────

function SourceView({ text }: { text: string }) {
  return (
    <div className="overflow-x-auto">
      <pre className="px-6 py-5 text-sm text-gray-700 leading-relaxed font-mono whitespace-pre-wrap break-words">
        {text}
      </pre>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArticleDraftContentSection({
  content,
  label = 'Content',
  showCopy = false,
  thumbnailImageUrl,
}: Props) {
  const [copied, setCopied]         = useState(false);
  // Review 단: preview | markdown | html / Content 단: preview | markdown(=raw)
  const [viewMode, setViewMode]     = useState<ViewMode>('preview');

  // HTML 변환 — showCopy(=Review) 단에서만 사용
  const htmlContent = useMemo<string>(() => {
    if (!showCopy) return '';
    return marked.parse(content) as string;
  }, [content, showCopy]);

  // 현재 모드에서 복사할 텍스트 (썸네일 있으면 상단 가운데 삽입)
  const copyText = (): string => {
    if (viewMode === 'markdown') {
      if (!thumbnailImageUrl) return content;
      const thumbMd = `<div align="center">\n\n![thumbnail](${thumbnailImageUrl})\n\n</div>\n\n`;
      return thumbMd + content;
    }
    // preview / html → HTML 복사
    if (!thumbnailImageUrl) return htmlContent;
    const thumbHtml =
      `<div style="text-align: center; margin-bottom: 24px;">\n` +
      `  <img src="${thumbnailImageUrl}" alt="thumbnail" style="max-width: 100%; height: auto;" />\n` +
      `</div>\n\n`;
    return thumbHtml + htmlContent;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const lineCount = viewMode === 'html'
    ? htmlContent.split('\n').length
    : content.split('\n').length;

  // ─── 토글 버튼 정의 ─────────────────────────────────────────────────────────
  // Review 단(showCopy): Preview | Markdown | HTML
  // Content 단         : Preview | Raw (내부적으로 'markdown' 모드)
  const tabs = showCopy
    ? ([
        { mode: 'preview'  as ViewMode, label: 'Preview'  },
        { mode: 'markdown' as ViewMode, label: 'Markdown' },
        { mode: 'html'     as ViewMode, label: 'HTML'     },
      ])
    : ([
        { mode: 'preview'  as ViewMode, label: 'Preview' },
        { mode: 'markdown' as ViewMode, label: 'Raw'     },
      ]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800">{label}</h2>
          {viewMode !== 'preview' && (
            <span className="text-xs text-gray-400 tabular-nums">{lineCount} lines</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 토글 */}
          <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-100 gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode)}
                className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${
                  viewMode === tab.mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Copy — Review 단(showCopy=true)에서만 표시 */}
          {showCopy && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={`Copy ${viewMode === 'markdown' ? 'markdown' : 'HTML'}`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy {viewMode === 'markdown' ? 'MD' : 'HTML'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {viewMode === 'preview' && (
        <MarkdownPreview content={content} thumbnailImageUrl={thumbnailImageUrl} />
      )}
      {viewMode === 'markdown' && (
        <SourceView text={content} />
      )}
      {viewMode === 'html' && (
        <SourceView text={htmlContent} />
      )}
    </div>
  );
}
