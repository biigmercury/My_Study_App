import ThemeToggle from '@/components/ThemeToggle'
import Link from 'next/link'
import Image from 'next/image'

interface PageHeaderProps {
  title?: string
  backHref?: string
}

export default function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      }}
    >
      <style>{`
        :root { --header-bg: rgba(244,250,252,0.85); }
        .dark { --header-bg: rgba(1,2,46,0.85); }
      `}</style>
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
              <span
                className="font-black text-lg text-brand-navy dark:text-white"
                style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
              >
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
