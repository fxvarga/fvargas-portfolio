import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// DEBUG: visible marker that JS bundle executed
(window as any).__TINYTOES_MAIN_LOADED__ = true;
console.log('[TinyToes] main.tsx loaded, protocol:', window.location.protocol);

try {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    document.body.innerHTML = '<h1 style="color:red;padding:40px">FATAL: #root not found</h1>';
  } else {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('[TinyToes] React render() called');
  }
} catch (e: any) {
  document.body.innerHTML = `<pre style="color:red;padding:40px;white-space:pre-wrap">REACT CRASH:\n${e?.stack || e}</pre>`;
  console.error('[TinyToes] React crash:', e);
}
