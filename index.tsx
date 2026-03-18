/**
 * @fileoverview Application entry point.
 *
 * Mounts the React application to the DOM root element using React 19's createRoot API.
 * Enables React.StrictMode for development-time warnings and checks.
 * Wraps the application in an ErrorBoundary to catch and handle runtime errors.
 *
 * @module index
 * @category Core
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
