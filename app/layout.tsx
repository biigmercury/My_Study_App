import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import MobileLayout from '@/components/MobileLayout'
import ReminderManager from '@/components/ReminderManager'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Use a custom domain via NEXT_PUBLIC_SITE_URL, else Vercel's stable production
// URL (set automatically on Vercel), else localhost for local dev.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'StudyOS',
  description: 'Personal learning platform — University of Ibadan CS & AI. Fully written lessons and AI-powered quizzes across 21 courses.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
  openGraph: {
    type: 'website',
    title: 'StudyOS — Personal Learning Platform',
    description: 'Fully written lessons and AI-powered quizzes across 21 Computer Science & AI courses.',
    url: SITE_URL,
    siteName: 'StudyOS',
    images: [
      {
        url: '/logo.jpg',
        width: 1024,
        height: 1006,
        alt: 'StudyOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyOS — Personal Learning Platform',
    description: 'Fully written lessons and AI-powered quizzes across 21 Computer Science & AI courses.',
    images: ['/logo.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ReminderManager />
          <MobileLayout>
            {children}
          </MobileLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
