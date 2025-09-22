import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import App from './App.tsx';

import './styles/index.style.css';

async function main() {

  const root = createRoot(document.getElementById('root')!);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

main();
