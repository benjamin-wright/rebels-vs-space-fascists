import { useState, type Dispatch } from 'react'
import type { Action, GameState } from '../state/types'

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export default function RoleAllocation({ state, dispatch }: Props) {
  const [revealed, setRevealed] = useState(false)
  const player = state.players[state.roleRevealIndex]

  function handleAcknowledge() {
    setRevealed(false)
    dispatch({ type: 'ACKNOWLEDGE_ROLE' })
  }

  if (!player) return null

  return (
    <main className="view-role-allocation">
      <h1>Role Allocation</h1>
      <p className="progress">
        Player {state.roleRevealIndex + 1} of {state.players.length}
      </p>

      {!revealed && (
        <div className="handoff-card">
          <p>Pass the phone to</p>
          <h2>{player.name}</h2>
          <button className="btn-primary" onClick={() => setRevealed(true)}>
            I am {player.name}, reveal my role
          </button>
        </div>
      )}

      {revealed && (
        <div className={`role-card role-card--${player.role}`}>
          <h2>{player.name}</h2>
          {player.role === 'rebel' ? (
            <>
              <p className="role-title">You are the Rebel</p>
              <p>
                You are invisible to the fascists. You can hack onto any warp gate or shuttle for
                free. Avoid capture until the rounds run out.
              </p>
            </>
          ) : (
            <>
              <p className="role-title">You are a Space Fascist</p>
              <p>
                Hunt down the rebel before time runs out. After each of your moves you&apos;ll see
                how many hops away the rebel currently is. Warp gates and shuttles cost tickets.
              </p>
            </>
          )}
          <button className="btn-primary" onClick={handleAcknowledge}>
            Got it, hide this
          </button>
        </div>
      )}
    </main>
  )
}
