import ThemeToggle from '@/components/ThemeToggle'
import Link from 'next/link'
import Image from 'next/image'

interface PageHeaderProps {
  title?: string
  backHref?: string
}

export default function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-brand-frost/90 dark:bg-brand-navy/95 backdrop-blur-md border-b border-brand-ice/40 dark:border-brand-ocean/20">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {backHref ? (
            <Link href={backHref} className="flex items-center gap-1.5 text-brand-ocean dark:text-brand-cyan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span className="text-sm font-medium">{title || 'Back'}</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                <Image
                  src="/logo.jpg"
                  alt="StudyOS"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="font-black text-lg bg-brand-gradient bg-clip-text text-transparent">
                StudyOS
              </span>
            </Link>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
