import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './studio.css';

import '../design/design.css';
import '../design/dark.css';
import './design-integration.css';
import './dark-appearance.css';
import './compact-layout.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
