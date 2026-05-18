import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/logger.ts';
import { logger } from './lib/logger.ts';

logger.markFileLoaded('src/main.tsx', 'entrypoint evaluated');
logger.markFileLoaded('src/index.css', 'stylesheet imported');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
