import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { serviceInitializer } from './services/ServiceInitializer'

// تهيئة نظام إدارة الخدمات بطريقة آمنة
serviceInitializer.initialize().catch(error => {
  console.error('❌ خطأ في تهيئة الخدمات:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
