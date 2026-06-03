'use client'

import { useEffect, useRef, useState } from 'react'
import type { Player as LordPlayer } from '@lordicon/react'

// Lazy loaders — keeps lottie-web and the icon JSON out of the shared bundle.
// Each is a separate async chunk fetched on the client after hydration.
const ICON_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  home: () => import('@/icons/home.json'),
  courses: () => import('@/icons/courses.json'),
  progress: () => import('@/icons/progress.json'),
  search: () => import('@/icons/search.json'),
  settings: () => import('@/icons/settings.json'),
}

interface Props {
  /** key into ICON_LOADERS (home | courses | progress | search | settings) */
  name: string
  /** is this the active tab */
  active: boolean
  /** hex colour to recolour the icon with */
  color: string
  /** rendered px size */
  size?: number
  /** incremented by the parent to trigger a replay (hover / tap) */
  playToken?: number
  /** static SVG shown during load / before hydration */
  fallback: React.ReactNode
}

export default function AnimatedNavIcon({
  name, active, color, size = 28, playToken = 0, fallback,
}: Props) {
  // Player is loaded lazily; typed loosely since the package's component type
  // isn't exported in a ref-friendly form. The ref keeps the precise type.
  const [Player, setPlayer] = useState<React.ElementType | null>(null)
  const [iconData, setIconData] = useState<unknown>(null)
  const playerRef = useRef<LordPlayer>(null)

  // Load the player + this icon's data once, client-side only.
  useEffect(() => {
    let alive = true
    Promise.all([import('@lordicon/react'), ICON_LOADERS[name]()])
      .then(([mod, icon]) => {
        if (!alive) return
        setPlayer(() => mod.Player)
        setIconData((icon as { default: unknown }).default ?? icon)
      })
      .catch(() => { /* keep the SVG fallback on failure */ })
    return () => { alive = false }
  }, [name])

  // Play when this tab becomes active.
  useEffect(() => {
    if (Player && active) playerRef.current?.playFromBeginning()
  }, [Player, active])

  // Play when the parent bumps the token (hover / tap).
  useEffect(() => {
    if (Player && playToken > 0) playerRef.current?.playFromBeginning()
  }, [Player, playToken])

  if (!Player || !iconData) return <>{fallback}</>

  return <Player ref={playerRef} icon={iconData} size={size} colorize={color} />
}
