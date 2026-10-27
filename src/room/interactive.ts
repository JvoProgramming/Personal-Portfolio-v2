import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { useT, type TKey } from '../lib/i18n'
import { useRoom } from './roomStore'

/** Pointer props for a clickable object: pointer cursor plus a label in the room overlay. */
export function useInteractive(label: TKey, onClick?: () => void, cursor?: string) {
  const [hovered, setHovered] = useState(false)
  const setHover = useRoom((s) => s.setHover)
  const t = useT()

  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = cursor ?? (onClick ? 'pointer' : 'default')
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered, onClick, cursor])

  return {
    hovered,
    props: {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(true)
        setHover(t(label))
      },
      onPointerOut: () => {
        setHovered(false)
        setHover(null)
      },
      onClick: onClick
        ? (e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation()
            onClick()
          }
        : undefined,
    },
  }
}
