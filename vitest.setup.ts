import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest globals are off, so testing-library cannot auto-register its cleanup.
afterEach(() => cleanup())
