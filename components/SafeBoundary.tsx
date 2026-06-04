'use client'

import { Component, type ReactNode } from 'react'

// Minimal error boundary: if its children throw (e.g. the lottie player fails
// to initialise), it renders the fallback instead of letting the error bubble
// up and unmount the surrounding UI.
export default class SafeBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    // swallow — the fallback is enough; nothing actionable to log here
  }

  render() {
    return this.state.failed ? <>{this.props.fallback}</> : this.props.children
  }
}
