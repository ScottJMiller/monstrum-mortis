import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element.');
const application = createRoot(root);
if (import.meta.env.DEV && location.pathname === '/art-gallery') {
  void import('./ArtGallery.tsx').then(({ ArtGallery }) => application.render(<StrictMode><ArtGallery /></StrictMode>));
} else if(import.meta.env.DEV && location.pathname === '/combat-gallery') {
  void import('./CombatGallery.tsx').then(({CombatGallery})=>application.render(<StrictMode><CombatGallery /></StrictMode>));
} else application.render(<StrictMode><App /></StrictMode>);
