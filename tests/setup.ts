/**
 * @fileoverview Test setup file for Vitest.
 *
 * Configures the testing environment with:
 * - jest-dom matchers for DOM assertions
 * - Mock for environment variables
 * - Cleanup after each test
 */

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock process.env for API key
vi.stubGlobal('process', {
  env: {
    API_KEY: 'test-api-key',
    GEMINI_API_KEY: 'test-api-key',
  },
});

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    /**
     *
     */
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    /**
     *
     */
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

vi.mock('vega-embed', () => {
  return {
    default: vi.fn(),
  };
});

window.HTMLElement.prototype.scrollIntoView = vi.fn();
