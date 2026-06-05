import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatPage } from '@/pages/ChatPage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { KnowledgeDetailPage } from '@/pages/KnowledgeDetailPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { VoicePage } from '@/pages/VoicePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VoicePage />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:runId" element={<ChatPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/knowledge/:type/:id" element={<KnowledgeDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
