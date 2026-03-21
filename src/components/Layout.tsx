import { Outlet, NavLink } from 'react-router-dom';
import { Sprout, FileText, Globe, NotebookPen } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/topic-seeds',      label: 'Topic Seeds',     icon: Sprout   },
  { to: '/article-drafts',   label: 'Article Drafts',  icon: FileText },
  { to: '/publish-history',  label: 'Publish History', icon: Globe    },
] as const;

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 flex items-center px-8">
        {/* 로고 */}
        <div className="flex items-center gap-2 py-3.5 pr-8 border-r border-gray-100 flex-shrink-0">
          <NotebookPen className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-sm text-gray-700">Blog Article Generator</span>
        </div>

        {/* 네비게이션 */}
        <nav className="flex items-center h-full ml-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3.5 text-sm border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* 페이지 콘텐츠 */}
      <Outlet />
    </div>
  );
}
