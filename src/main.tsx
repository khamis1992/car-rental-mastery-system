
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGlobalErrorHandling } from './utils/errorHandling';
import { realtimeHandler } from './utils/realtimeConnectionHandler';

// إعداد معالجة الأخطاء العامة
setupGlobalErrorHandling();

// تهيئة اتصال Realtime
realtimeHandler.initializeConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
