import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import TopicSeedPage from './pages/TopicSeedPage';
import TopicCandidatePage from './pages/TopicCandidatePage';
import ArticleDraftListPage from './pages/ArticleDraftListPage';
import ArticleDraftDetailPage from './pages/ArticleDraftDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/topic-seeds" replace />} />
            <Route path="/topic-seeds" element={<TopicSeedPage />} />
            <Route path="/topic-candidates" element={<TopicCandidatePage />} />
            <Route path="/article-drafts" element={<ArticleDraftListPage />} />
            <Route path="/article-drafts/:id" element={<ArticleDraftDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
