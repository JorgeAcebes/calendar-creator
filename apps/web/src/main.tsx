import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent browser/WebView2 built-in zoom so our canvas zoom handles it.
// Touchpad pinch-to-zoom sends wheel events with ctrlKey=true; WebView2
// would otherwise intercept those and zoom the entire webview.
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey || e.metaKey) e.preventDefault();
  },
  { passive: false },
);

// Also prevent Ctrl+Plus / Ctrl+Minus keyboard shortcuts from zooming the webview
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
