import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { analytics } from '@/lib/analytics';
import './index.css';

analytics.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
