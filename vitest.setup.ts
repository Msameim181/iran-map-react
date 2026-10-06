import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest globals are off, so testing-library cannot auto-register its cleanup.
afterEach(() => cleanup())

// jsdom has no canvas; axe-core probes `getContext` for icon-ligature detection.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']
}
