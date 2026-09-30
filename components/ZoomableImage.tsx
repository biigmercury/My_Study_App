'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ZoomableImageProps {
  src: string
  alt?: string
  className?: string
}

// Fits the image to the lesson column; tapping opens it at natural size in a scrollable overlay.
export default function ZoomableImage({ src, alt = '', className = '' }: ZoomableImageProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full cursor-zoom-in" aria-label={`Enlarge: ${alt || 'image'}`}>
        <img src={src} alt={alt} className={`max-w-full h-auto mx-auto ${className}`} />
      </button>
      <span className="not-prose block text-center text-[10.5px] text-brand-navy/40 dark:text-white/35 mt-1.5">Tap to enlarge</span>
      {open && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/85 overflow-auto" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="min-h-full min-w-full w-max flex items-center justify-center p-4">
            <img src={src} alt={alt} className="max-w-none bg-white rounded-lg" />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-brand-navy font-bold shadow"
            aria-label="Close"
          >
            ✕
          </button>
        </div>,
        document.body,
      )}
    </>
  )
}
