import '../studio/splash.css';
import { showStudioSplash } from '../studio/splash';

// Load game input only after the studio has consumed the skip press and release.
await showStudioSplash();
await import('./main');
requestAnimationFrame(() => { delete document.documentElement.dataset.startup; });
