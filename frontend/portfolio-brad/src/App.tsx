import { useState, useEffect, useCallback } from 'react';
import Home from './pages/Home';
import { fetchCMSContent, defaultContent, type CMSContent } from './cms';
import { CmsAgentWrapper } from './agent/CmsAgentWrapper';

function App() {
  const [realContent, setRealContent] = useState<CMSContent>(defaultContent);
  const [displayContent, setDisplayContent] = useState<CMSContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  const loadContent = useCallback(() => {
    return fetchCMSContent()
      .then((data) => {
        setRealContent(data);
        setDisplayContent(data);
      });
  }, []);

  useEffect(() => {
    loadContent().finally(() => setLoading(false));
  }, [loadContent]);

  const handleRefetch = useCallback(async () => {
    await loadContent();
  }, [loadContent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-body">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <CmsAgentWrapper content={realContent} onContentChange={setDisplayContent} onRefetch={handleRefetch}>
      <Home content={displayContent} />
    </CmsAgentWrapper>
  );
}

export default App;
