import { useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Sprout, FileText, Globe, NotebookPen, Database, ImageIcon } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/topic-seeds',           label: 'Topic Seeds',          icon: Sprout    },
  { to: '/article-drafts',        label: 'Article Drafts',       icon: FileText  },
  { to: '/publish-history',       label: 'Publish History',      icon: Globe     },
  { to: '/api-sources',           label: 'API Sources',          icon: Database  },
  { to: '/thumbnail-generator',   label: 'Thumbnail Generator',  icon: ImageIcon },
] as const;

export default function Layout() {
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);

  // On narrow screens the nav scrolls horizontally — center the active tab so it stays visible
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const navRect = nav.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    nav.scrollLeft += activeRect.left - navRect.left - (navRect.width - activeRect.width) / 2;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 flex items-center px-4 sm:px-8">
        {/* 로고 */}
        <div className="flex items-center gap-2 py-3.5 pr-4 sm:pr-8 border-r border-gray-100 flex-shrink-0">
          <NotebookPen className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline font-semibold text-sm text-gray-700">Blog Article Generator</span>
        </div>

        {/* Navigation — scrolls horizontally instead of widening the page */}
        <nav
          ref={navRef}
          className="flex items-center h-full ml-2 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 sm:px-4 py-3.5 text-sm whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
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
