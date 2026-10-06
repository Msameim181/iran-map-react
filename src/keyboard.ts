import type { KeyboardEvent } from 'react'

// Space activates on key *release* (like a native button) and ignores key repeat, so holding the key
// does not toggle repeatedly. Enter activates on press. The set tracks Space presses begun on an element.
const spaceDown = new WeakSet<EventTarget>()

export const getActivationProps = (activate: () => void) => ({
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (!event.repeat) activate()
    } else if (event.key === ' ') {
      // Stops the page from scrolling on Space.
      event.preventDefault()
      if (!event.repeat) spaceDown.add(event.currentTarget)
    }
  },
  onKeyUp: (event: KeyboardEvent) => {
    if (event.key === ' ' && spaceDown.delete(event.currentTarget)) {
      event.preventDefault()
      activate()
    }
  },
})

/** Forget a Space press that never saw its key release (focus moved away). */
export const clearActivation = (event: { currentTarget: EventTarget }) => {
  spaceDown.delete(event.currentTarget)
}
