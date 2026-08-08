import type { Dispatch } from 'react'
import type { Action, GameState } from '../state/types'

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export default function GameOver({ state, dispatch }: Props) {
  const rebel = state.players.find(p => p.role === 'rebel')

  return (
    <main className="view-game-over">
      <h1>Game Over</h1>
      {state.winner === 'rebel' ? (
        <p className="result result--rebel">
          The rebels win! {rebel?.name} evaded capture for {state.maxRounds} rounds.
        </p>
      ) : (
        <p className="result result--fascist">The Space Fascist Empire wins! {rebel?.name} was captured.</p>
      )}

      <ul className="final-roster">
        {state.players.map(p => (
          <li key={p.name}>
            {p.name} &ndash; {p.role === 'rebel' ? 'Rebel' : 'Space Fascist'}
          </li>
        ))}
      </ul>

      <button className="btn-primary" onClick={() => dispatch({ type: 'RESET_GAME' })}>
        Play again
      </button>
    </main>
  )
}
