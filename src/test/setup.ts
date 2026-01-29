import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock PointerEvent
if (!window.PointerEvent) {
  // @ts-ignore
  window.PointerEvent = class extends Event {
    // @ts-ignore
    constructor(type, props) {
      super(type, props);
    }
  };
}

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  cleanup();
});
