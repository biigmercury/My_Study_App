import PageHeader from '@/components/PageHeader'
import BottomNav from '@/components/BottomNav'

interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  backHref?: string
}

export default function MobileLayout({ children, title, backHref }: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex justify-center bg-brand-soft dark:bg-brand-navy">
      <div className="w-full max-w-[430px] flex flex-col min-h-screen relative shadow-2xl">
        <PageHeader title={title} backHref={backHref} />
        <main className="flex-1 pb-24 overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
