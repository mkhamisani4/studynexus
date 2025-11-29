'use client'

import StudyMaterials from './features/StudyMaterials'
import KnowledgeGraph from './features/KnowledgeGraph'
import ExamMode from './features/ExamMode'
import Flashcards from './features/Flashcards'
import ExplainConcepts from './features/ExplainConcepts'
import StudySchedule from './features/StudySchedule'
import Progress from './features/Progress'
import ReverseLearning from './features/ReverseLearning'
import AdditionalResources from './features/AdditionalResources'
import ResearchAssistant from './features/ResearchAssistant'
import DashboardView from './features/DashboardView'
import About from './features/About'
import Profile from './features/Profile'

interface DashboardProps {
  activeView: string
  setActiveView: (view: string) => void
  viewData?: any
}

export default function Dashboard({ activeView, setActiveView, viewData }: DashboardProps) {
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView setActiveView={setActiveView} />
      case 'materials':
        return <StudyMaterials setActiveView={setActiveView} />
      case 'knowledge-graph':
        return <KnowledgeGraph />
      case 'exam-mode':
        return <ExamMode />
      case 'flashcards':
        return <Flashcards />
      case 'explain':
        return <ExplainConcepts />
      case 'schedule':
        return <StudySchedule />
      case 'progress':
        return <Progress />
      case 'reverse-learning':
        return <ReverseLearning />
      case 'citations':
        return <AdditionalResources 
          initialContent={viewData?.content || ''} 
          materialTitle={viewData?.title}
          initialMaterialId={viewData?.materialId}
        />
      case 'research':
        return <ResearchAssistant />
      case 'about':
        return <About />
      case 'profile':
        return <Profile />
      default:
        return <DashboardView />
    }
  }

  return <div className="w-full max-w-full mx-auto overflow-x-hidden">{renderView()}</div>
}
