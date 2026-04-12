import { GameProvider } from './context/GameContext'
import Wizard from './components/Wizard'

export default function App() {
  return (
    <GameProvider>
      <Wizard />
    </GameProvider>
  )
}
