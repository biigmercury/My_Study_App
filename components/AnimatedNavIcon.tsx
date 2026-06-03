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

// Each icon's default "hover" animation state (the segment we rest on and play).
// Resting on this state shows the fully-drawn icon; the file's global frame 0
// is the "reveal-in" start, which is blank — so we must pin the state.
const ICON_STATES: Record<string, string> = {
  home: 'hover-3d-roll',
  courses: 'hover-pinch',
  progress: 'hover-pinch',
  search: 'hover-spin',
  settings: 'hover-machine',
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

  // Land on a visible, fully-drawn frame (end of the hover state) instead of
  // the blank reveal-in start frame.
  const showResting = () => playerRef.current?.goToLastFrame()

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

  // Play when this tab becomes active; otherwise sit on the resting frame.
  useEffect(() => {
    if (!Player) return
    if (active) playerRef.current?.playFromBeginning()
    else showResting()
  }, [Player, active])

  // Play when the parent bumps the token (hover / tap).
  useEffect(() => {
    if (Player && playToken > 0) playerRef.current?.playFromBeginning()
  }, [Player, playToken])

  // Re-colouring (active/theme change) refreshes the lottie and can reset it to
  // the blank start frame — restore a visible resting frame after that.
  useEffect(() => {
    if (Player && !active) showResting()
  }, [Player, color, active])

  if (!Player || !iconData) return <>{fallback}</>

  return (
    <Player
      ref={playerRef}
      icon={iconData}
      size={size}
      colorize={color}
      state={ICON_STATES[name]}
      onReady={showResting}
    />
  )
}
