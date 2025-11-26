'use client'

import StudyMaterials from './features/StudyMaterials'
import KnowledgeGraph from './features/KnowledgeGraph'
import ExamMode from './features/ExamMode'
import Flashcards from './features/Flashcards'
import ExplainConcepts from './features/ExplainConcepts'
import StudyCoach from './features/StudyCoach'
import StudySchedule from './features/StudySchedule'
import Progress from './features/Progress'
import ReverseLearning from './features/ReverseLearning'
import CitationFinder from './features/CitationFinder'
import ResearchAssistant from './features/ResearchAssistant'
import DashboardView from './features/DashboardView'

interface DashboardProps {
  activeView: string
  setActiveView: (view: string) => void
}

export default function Dashboard({ activeView, setActiveView }: DashboardProps) {
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView setActiveView={setActiveView} />
      case 'materials':
        return <StudyMaterials />
      case 'knowledge-graph':
        return <KnowledgeGraph />
      case 'exam-mode':
        return <ExamMode />
      case 'flashcards':
        return <Flashcards />
      case 'explain':
        return <ExplainConcepts />
      case 'coach':
        return <StudyCoach />
      case 'schedule':
        return <StudySchedule />
      case 'progress':
        return <Progress />
      case 'reverse-learning':
        return <ReverseLearning />
      case 'citations':
        return <CitationFinder />
      case 'research':
        return <ResearchAssistant />
      default:
        return <DashboardView />
    }
  }

  return <div className="w-full max-w-full mx-auto overflow-x-hidden">{renderView()}</div>
}

