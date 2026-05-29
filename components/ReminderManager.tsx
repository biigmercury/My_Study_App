'use client'

import { useEffect } from 'react'
import { registerServiceWorker, initReminders } from '@/lib/settings'

// Mounted once at the app root. Registers the service worker (for real
// system notifications) and re-arms the daily reminder on every app launch
// if the user has reminders enabled.
export default function ReminderManager() {
  useEffect(() => {
    void registerServiceWorker().then(() => {
      initReminders()
    })
  }, [])

  return null
}
