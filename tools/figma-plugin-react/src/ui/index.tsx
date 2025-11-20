import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

console.log('🚀 Plugin UI script loaded!');
console.log('Looking for root element...');

const root = document.getElementById('root');

if (!root) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

console.log('✅ Root element found, mounting React...');

try {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
  console.log('✅ React mounted successfully!');
} catch (error) {
  console.error('❌ Error mounting React:', error);
  throw error;
}
