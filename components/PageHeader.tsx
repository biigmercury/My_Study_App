import ThemeToggle from '@/components/ThemeToggle'
import Link from 'next/link'
import Image from 'next/image'

interface PageHeaderProps {
  title?: string
  backHref?: string
}

export default function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-brand-navy/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/40">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {backHref ? (
            <Link href={backHref} className="flex items-center gap-1.5 text-brand-royal dark:text-brand-sky">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span className="text-sm font-medium">{title || 'Back'}</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="StudyOS" width={28} height={28} className="rounded-lg" />
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
