import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress benign ResizeObserver loop error common in layout libraries like ReactFlow
const resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications';
const resizeObserverLimitErr = 'ResizeObserver loop limit exceeded';

window.addEventListener('error', (event) => {
  if (typeof event.message === 'string' && (
      event.message.includes(resizeObserverLoopErr) || 
      event.message.includes(resizeObserverLimitErr)
  )) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);