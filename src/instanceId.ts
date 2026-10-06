import * as React from 'react'
import { useRef } from 'react'

// `useId` only exists in React 18+. Read it off the namespace so bundlers do not warn about a missing named export.
const reactUseId = (React as unknown as { useId?: () => string }).useId

let counter = 0

/** Fallback for React < 18: stable per component instance, but not hydration-safe (pass `tooltipId` for SSR). */
const useCounterId = () => {
  const id = useRef<string>()
  if (!id.current) id.current = `m${++counter}`
  return id.current
}

/** A unique id per component instance; `useId` when available (hydration-safe), else a counter. */
export const useInstanceId: () => string = reactUseId ?? useCounterId

/** Ids end up inside CSS attribute selectors and `data-*` attributes, so keep them to word characters. */
export const sanitizeId = (id: string) => id.replace(/[^\w-]/g, '-')
