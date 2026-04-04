import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App.tsx';
import './index.css';
import { shouldHydrateRoot } from './utils/ssrHydration';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing root element');
}

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

const shouldHydrate = shouldHydrateRoot({
  currentPathname: window.location.pathname,
  hasExistingMarkup: rootElement.hasChildNodes(),
  prerenderedPath: rootElement.dataset.prerenderedPath,
});

if (shouldHydrate) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
