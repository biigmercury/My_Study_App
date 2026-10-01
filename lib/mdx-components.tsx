import { isValidElement } from 'react'
import type { MDXComponents } from 'mdx/types'
import CodeBlock from '@/components/CodeBlock'
import FormulaBlock from '@/components/FormulaBlock'
import DiagramBlock from '@/components/DiagramBlock'
import TakeawayBlock from '@/components/TakeawayBlock'
import StepBlock from '@/components/StepBlock'
import FlowDiagram, { FlowStep } from '@/components/FlowDiagram'
import Tabs, { Tab } from '@/components/Tabs'
import RevealBlock from '@/components/RevealBlock'
import MCQ from '@/components/MCQ'
import { Option, Explain } from '@/components/MCQParts'
import CostBenefitCalculator from '@/components/interactive/CostBenefitCalculator'
import ZoomableImage from '@/components/ZoomableImage'
import CheckDigitCalculator from '@/components/interactive/CheckDigitCalculator'
import ContrastChecker from '@/components/interactive/ContrastChecker'
import FittsHickCalculator from '@/components/interactive/FittsHickCalculator'
import CodePlayground from '@/components/interactive/CodePlayground'
import SqlPlayground from '@/components/interactive/SqlPlayground'
import PhpPlayground from '@/components/interactive/PhpPlayground'
import CodeTrace from '@/components/interactive/CodeTrace'
import CollectionsDemo from '@/components/interactive/CollectionsDemo'
import SortVisualizer from '@/components/interactive/SortVisualizer'
import SearchVisualizer from '@/components/interactive/SearchVisualizer'
import SwingEventDemo from '@/components/interactive/SwingEventDemo'
import RaceConditionDemo from '@/components/interactive/RaceConditionDemo'
import CgpaCalculator from '@/components/interactive/CgpaCalculator'
import ExcelSheet from '@/components/interactive/ExcelSheet'
import ChartBuilder from '@/components/interactive/ChartBuilder'
import RibbonExplorer from '@/components/interactive/RibbonExplorer'
import SlideDesignChecker from '@/components/interactive/SlideDesignChecker'
import SlideShowSimulator from '@/components/interactive/SlideShowSimulator'
import WordFormatLab from '@/components/interactive/WordFormatLab'
import FindReplaceDemo from '@/components/interactive/FindReplaceDemo'
import WordTableLab from '@/components/interactive/WordTableLab'
import TrackChangesDemo from '@/components/interactive/TrackChangesDemo'
import PageNumberingLab from '@/components/interactive/PageNumberingLab'
import MailMergeDemo from '@/components/interactive/MailMergeDemo'
import TocDemo from '@/components/interactive/TocDemo'
import AccessTableDesigner from '@/components/interactive/AccessTableDesigner'
import QueryDesignGrid from '@/components/interactive/QueryDesignGrid'
import AccessFormReport from '@/components/interactive/AccessFormReport'
import SortingGame from '@/components/interactive/SortingGame'
import TruthTable from '@/components/interactive/TruthTable'
import RelationGraph from '@/components/interactive/RelationGraph'
import RiverCrossing from '@/components/interactive/RiverCrossing'
import LogicGrid from '@/components/interactive/LogicGrid'
import PhonemeChart from '@/components/interactive/PhonemeChart'
import PronunciationList from '@/components/interactive/PronunciationList'
import StressPicker from '@/components/interactive/StressPicker'
import ScansionPad from '@/components/interactive/ScansionPad'
import DocAnatomy from '@/components/interactive/DocAnatomy'
import OrderPuzzle from '@/components/interactive/OrderPuzzle'
import ReadingSpeed from '@/components/interactive/ReadingSpeed'
import ErrorSpotter from '@/components/interactive/ErrorSpotter'
import Checklist from '@/components/interactive/Checklist'
import Timeline from '@/components/interactive/Timeline'
import PlacementSim from '@/components/interactive/PlacementSim'
import SiwesLetterBuilder from '@/components/interactive/SiwesLetterBuilder'
import LogEntryCoach from '@/components/interactive/LogEntryCoach'
import QuestionDrill from '@/components/interactive/QuestionDrill'

export const mdxComponents: MDXComponents = {
  CodeBlock,
  FormulaBlock,
  DiagramBlock,
  Takeaway: TakeawayBlock,
  Step: StepBlock,
  FlowDiagram,
  FlowStep,
  Tabs,
  Tab,
  Reveal: RevealBlock,
  MCQ,
  Option,
  Explain,
  CostBenefitCalculator,
  CheckDigitCalculator,
  ContrastChecker,
  FittsHickCalculator,
  Playground: CodePlayground,
  SqlPlayground,
  PhpPlayground,
  CodeTrace,
  CollectionsDemo,
  SortVisualizer,
  SearchVisualizer,
  SwingEventDemo,
  RaceConditionDemo,
  CgpaCalculator,
  ExcelSheet,
  ChartBuilder,
  RibbonExplorer,
  SlideDesignChecker,
  SlideShowSimulator,
  WordFormatLab,
  FindReplaceDemo,
  WordTableLab,
  TrackChangesDemo,
  PageNumberingLab,
  MailMergeDemo,
  TocDemo,
  AccessTableDesigner,
  QueryDesignGrid,
  AccessFormReport,
  SortingGame,
  TruthTable,
  RelationGraph,
  RiverCrossing,
  LogicGrid,
  PhonemeChart,
  PronunciationList,
  StressPicker,
  ScansionPad,
  DocAnatomy,
  OrderPuzzle,
  ReadingSpeed,
  ErrorSpotter,
  Checklist,
  Timeline,
  PlacementSim,
  SiwesLetterBuilder,
  LogEntryCoach,
  QuestionDrill,

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

  // Wide tables scroll sideways on phones instead of running off the edge of the page.
  table: (props) => (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  ),

  img: (props) => (
    <span className="not-prose block my-6 rounded-xl overflow-hidden bg-white p-2 border border-slate-200 dark:border-slate-700">
      <ZoomableImage src={props.src ?? ''} alt={props.alt ?? ''} />
    </span>
  ),

  // A fenced block with no language reaches `code` without a className, which would
  // otherwise render it as inline code and collapse its whitespace.
  pre: (props) => {
    const child = props.children
    if (isValidElement<{ className?: string; children?: unknown }>(child) && !child.props.className && typeof child.props.children === 'string') {
      return <CodeBlock className="language-text">{child.props.children}</CodeBlock>
    }
    return <>{props.children}</>
  },

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
