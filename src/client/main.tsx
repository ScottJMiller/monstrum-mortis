import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';
import './fonts.css';
import './refinement.css';
import './victorian-frames.css';
import './simplification.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element.');
const application = createRoot(root);
if (import.meta.env.DEV && location.pathname === '/battle-v2') {
  void import('./battle-v2/Preview.tsx').then(({ Preview }) => application.render(<StrictMode><Preview /></StrictMode>));
} else if (import.meta.env.DEV && location.pathname === '/specimen-gallery') {
  void import('./SpecimenGallery.tsx').then(({SpecimenGallery})=>application.render(<StrictMode><SpecimenGallery/></StrictMode>));
} else if (import.meta.env.DEV && location.pathname === '/art-gallery') {
  void import('./ArtGallery.tsx').then(({ ArtGallery }) => application.render(<StrictMode><ArtGallery /></StrictMode>));
} else if(import.meta.env.DEV && location.pathname === '/combat-gallery') {
  void import('./CombatGallery.tsx').then(({CombatGallery})=>application.render(<StrictMode><CombatGallery /></StrictMode>));
} else application.render(<StrictMode><App /></StrictMode>);
