import { useState, useEffect, useCallback } from 'react';
import Home from './pages/Home';
import { fetchCMSContent, defaultContent, type CMSContent } from './cms';
import { CmsAgentWrapper } from './agent/CmsAgentWrapper';

function App() {
  // realContent = source of truth from CMS (never preview-tainted)
  // displayContent = what components render (may be preview-modified)
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500 text-lg">Loading...</p>
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
