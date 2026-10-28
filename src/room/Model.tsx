import { Component, Suspense, useLayoutEffect, type ReactNode } from 'react'
import { useModel, type ModelProps } from './useModel'

// Downloaded models (see /credits) live in public/models as Draco/meshopt-compressed GLBs.
// Each one streams in after the room appears; until it arrives, or if it fails, the
// hand-built version is shown instead, so the room is never empty or broken.

function LoadedModel({ url, fit, rotation, order, position, onReady, shadows = true, centered }: ModelProps) {
  const { root } = useModel(url, fit, rotation, shadows, order, centered)
  useLayoutEffect(() => onReady?.(root), [root, onReady])
  return <primitive object={root} position={position} />
}

class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('A room model failed to load; using the built-in one.', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Shows `fallback` while the model loads, and keeps it if loading fails. */
export function Upgrade({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return (
    <Fallback fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </Fallback>
  )
}

/** A downloaded model with the hand-built one standing in until it arrives. */
export function Model({ fallback, ...props }: ModelProps & { fallback: ReactNode }) {
  return (
    <Upgrade fallback={fallback}>
      <LoadedModel {...props} />
    </Upgrade>
  )
}
