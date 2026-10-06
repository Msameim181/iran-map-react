import { useEffect, useLayoutEffect } from 'react'

/** `useLayoutEffect` warns during server rendering, so fall back to `useEffect` there. */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
