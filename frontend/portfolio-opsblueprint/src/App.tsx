import { useState, useEffect, useCallback } from 'react';
import Home from './pages/Home';
import { fetchCMSContent, defaultContent, type CMSContent } from './cms';
import { CmsAgentWrapper } from './agent/CmsAgentWrapper';

function App() {
  const [content, setContent] = useState<CMSContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  const loadContent = useCallback(() => {
    return fetchCMSContent()
      .then(setContent);
  }, []);

  useEffect(() => {
    loadContent().finally(() => setLoading(false));
  }, [loadContent]);

  const handleRefetch = useCallback(async () => {
    await loadContent();
  }, [loadContent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <CmsAgentWrapper content={content} onContentChange={setContent} onRefetch={handleRefetch}>
      <Home content={content} />
    </CmsAgentWrapper>
  );
}

export default App;
