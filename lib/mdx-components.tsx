import type { MDXComponents } from 'mdx/types'
import CodeBlock from '@/components/CodeBlock'
import FormulaBlock from '@/components/FormulaBlock'
import DiagramBlock from '@/components/DiagramBlock'
import TakeawayBlock from '@/components/TakeawayBlock'
import StepBlock from '@/components/StepBlock'

export const mdxComponents: MDXComponents = {
  CodeBlock,
  FormulaBlock,
  DiagramBlock,
  Takeaway: TakeawayBlock,
  Step: StepBlock,

  Analogy: ({ children }: { children: React.ReactNode }) => (
    <div className="my-6 rounded-xl border-l-4 border-brand-sky bg-blue-50 dark:bg-blue-950/30 p-4">
      <p className="text-xs font-bold text-brand-royal dark:text-brand-sky mb-2 uppercase tracking-wide">
        💡 Analogy
      </p>
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{children}</div>
    </div>
  ),

  ExamTip: ({ children }: { children: React.ReactNode }) => (
    <div className="my-6 rounded-xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4">
      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wide">
        📝 Exam Tip
      </p>
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{children}</div>
    </div>
  ),

  pre: (props) => <>{props.children}</>,

  code: (props) => {
    const { children, className } = props as { children: React.ReactNode; className?: string }
    if (!className) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-brand-royal dark:text-brand-sky font-mono text-[0.85em]">
          {children}
        </code>
      )
    }
    if (className === 'language-mermaid') {
      return <DiagramBlock chart={children as string} />
    }
    return <CodeBlock className={className}>{children as string}</CodeBlock>
  },
}
