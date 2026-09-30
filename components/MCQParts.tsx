// Server-rendered parts of an <MCQ>. They render tagged elements so the client MCQ can
// identify them by props — component identity does not survive the RSC boundary.

export function Option({ correct, children }: { correct?: boolean; children: React.ReactNode }) {
  return (
    <div data-mcq="option" data-correct={correct ? 'true' : undefined}>
      {children}
    </div>
  )
}

export function Explain({ children }: { children: React.ReactNode }) {
  return <div data-mcq="explain">{children}</div>
}
