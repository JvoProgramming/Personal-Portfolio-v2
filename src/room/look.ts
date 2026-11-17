// Shared bits of the camera rig that live outside React: the fade-to-black veil and the drag tracker.

let veilEl: HTMLDivElement | null = null

/** The black veil over the room that the camera fades in as it reaches the screen, and out on the way back. */
export function bindVeil(el: HTMLDivElement | null) {
  veilEl = el
}

export function setVeil(opacity: number) {
  if (veilEl) veilEl.style.opacity = opacity.toFixed(3)
}

/** How far (px) the current press has moved. A press that turned into a look-around drag isn't a click. */
export const pointerDrag = {
  moved: 0,
  /** Set by objects that own the drag themselves (picking up a toy, petting Mochi, spinning the chair). */
  claimed: false,
}

export const DRAG_CLICK_PX = 6

export function wasDrag() {
  return pointerDrag.moved > DRAG_CLICK_PX
}
