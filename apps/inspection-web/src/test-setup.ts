import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { Blob, File } from 'node:buffer';

// fake-indexeddb uses Node's structuredClone; use its cloneable Blob/File
// implementations rather than jsdom wrappers, which clone as empty objects.
Object.defineProperty(globalThis, 'Blob', { value: Blob, writable: true });
Object.defineProperty(globalThis, 'File', { value: File, writable: true });

afterEach(cleanup);
