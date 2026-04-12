import { useState } from 'react'
import { useGame } from '../context/GameContext'
import ImageUpload from './steps/ImageUpload'
import AnnotationCanvas from './steps/AnnotationCanvas'
import MovementForm from './steps/MovementForm'
import WinConditionForm from './steps/WinConditionForm'
import SpecialRulesForm from './steps/SpecialRulesForm'
import Preview from './steps/Preview'

const STEPS = [
  { id: 1, label: 'Upload Image',   component: ImageUpload },
  { id: 2, label: 'Find Characters', component: AnnotationCanvas },
  { id: 3, label: 'Movements',      component: MovementForm },
  { id: 4, label: 'Win Condition',  component: WinConditionForm },
  { id: 5, label: 'Special Rules',  component: SpecialRulesForm },
  { id: 6, label: 'Preview',        component: Preview },
]

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const { gameSpec } = useGame()

  const step = STEPS[currentStep]
  const StepComponent = step.component
  const isFirst = currentStep === 0
  const isLast = currentStep === STEPS.length - 1

  // Gate each step before proceeding
  const canProceed =
    currentStep === 0 ? !!gameSpec.background :
    currentStep === 1 ? gameSpec.elements?.length > 0 :
    currentStep === 3 ? !!gameSpec.winCondition?.type :
    true

  return (
    <div className="wizard">
      <header className="wizard-header">
        <h1>Story2Play</h1>
        <p className="tagline">Turn your drawing into a real game!</p>
      </header>

      <nav className="step-nav">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            className={`step-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
            onClick={() => setCurrentStep(i)}
            aria-label={`Go to step ${s.id}: ${s.label}`}
            title={s.label}
          >
            {i < currentStep ? '✓' : s.id}
          </button>
        ))}
      </nav>

      <main className="wizard-body">
        <StepComponent />
      </main>

      <footer className="wizard-footer">
        {!isFirst && (
          <button className="btn btn-secondary" onClick={() => setCurrentStep(prev => prev - 1)}>
            ← Back
          </button>
        )}
        {!isLast && (
          <button
            className="btn btn-primary"
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed}
          >
            Next →
          </button>
        )}
      </footer>
    </div>
  )
}
