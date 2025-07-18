import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { vehicleStatusEventHandler } from './services/VehicleStatusEventHandler'

// تهيئة نظام إدارة حالات المركبات
vehicleStatusEventHandler.initialize();

createRoot(document.getElementById("root")!).render(<App />);
