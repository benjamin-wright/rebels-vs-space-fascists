import { useReducer, useEffect } from 'react'
import { reducer } from './state/reducer'
import { loadState, saveState } from './state/storage'
import NameEntry from './views/NameEntry'
import RoleAllocation from './views/RoleAllocation'
import GameBoard from './views/GameBoard'
import GameOver from './views/GameOver'

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <div id="app">
      {state.phase === 'name-entry' && <NameEntry state={state} dispatch={dispatch} />}
      {state.phase === 'role-allocation' && <RoleAllocation state={state} dispatch={dispatch} />}
      {state.phase === 'playing' && <GameBoard state={state} dispatch={dispatch} />}
      {state.phase === 'game-over' && <GameOver state={state} dispatch={dispatch} />}
    </div>
  )
}

export default App
