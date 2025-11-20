import '@testing-library/jest-dom';

// Mock parent.postMessage for plugin communication tests
global.parent = {
  postMessage: jest.fn(),
} as any;

// Mock window.addEventListener for message handling tests
const originalAddEventListener = window.addEventListener;
window.addEventListener = jest.fn(originalAddEventListener);

// Mock window.removeEventListener
const originalRemoveEventListener = window.removeEventListener;
window.removeEventListener = jest.fn(originalRemoveEventListener);
