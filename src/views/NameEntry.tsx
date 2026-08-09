import type { Dispatch } from 'react'
import type { Action, GameState } from '../state/types'
import { MAX_PLAYERS, MIN_PLAYERS } from '../state/types'
import DevBoardControls from './DevBoardControls'

const IS_QA = import.meta.env.VITE_QA === 'true'

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export default function NameEntry({ state, dispatch }: Props) {
  const filledNames = state.playerNames.filter(n => n.trim()).length
  const canStart = filledNames >= MIN_PLAYERS
  const canAdd = state.playerNames.length < MAX_PLAYERS
  const canRemove = state.playerNames.length > 1

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (canStart) dispatch({ type: 'START_ROLE_ALLOCATION' })
  }

  return (
    <main className="view-name-entry">
      <h1>Rebels vs Space Fascists</h1>
      <p className="tagline">
        A hidden-movement game for {MIN_PLAYERS}-{MAX_PLAYERS} players. Pass the phone around&nbsp;-
        one rebel hides among the fascist empire.
      </p>

      <form className="setup-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Players</legend>
          {state.playerNames.map((name, i) => (
            <div className="player-row" key={i}>
              <input
                type="text"
                placeholder={`Player ${i + 1}`}
                value={name}
                onChange={e => dispatch({ type: 'UPDATE_PLAYER_NAME', index: i, name: e.target.value })}
                autoFocus={i === 0}
                maxLength={20}
              />
              {canRemove && (
                <button
                  type="button"
                  className="btn-ghost"
                  aria-label={`Remove player ${i + 1}`}
                  onClick={() => dispatch({ type: 'REMOVE_PLAYER', index: i })}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {canAdd && (
            <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'ADD_PLAYER' })}>
              + Add player
            </button>
          )}
        </fieldset>

        <button type="submit" className="btn-primary" disabled={!canStart}>
          Allocate roles
        </button>
        {!canStart && <p className="hint">Enter at least {MIN_PLAYERS} names to start.</p>}
      </form>

      {IS_QA && canStart && <DevBoardControls dispatch={dispatch} />}
    </main>
  )
}
