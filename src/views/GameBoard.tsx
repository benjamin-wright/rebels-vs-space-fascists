import type { Dispatch } from 'react'
import type { Action, GameState } from '../state/types'
import { getConnections, shortestDistance } from '../board/graph'

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

const MODE_LABELS: Record<string, string> = {
  monorail: 'Monorail (free)',
  warp: 'Warp gate',
  shuttle: 'Shuttle',
}

export default function GameBoard({ state, dispatch }: Props) {
  const { board, players, currentPlayerIndex, turnRevealed, round, maxRounds } = state
  if (!board) return null

  const player = players[currentPlayerIndex]
  const rebel = players.find(p => p.role === 'rebel')!

  if (!turnRevealed) {
    return (
      <main className="view-game-board">
        <p className="round-indicator">
          Round {round} of {maxRounds}
        </p>
        <div className="handoff-card">
          <p>Pass the phone to</p>
          <h2>{player.name}</h2>
          <button className="btn-primary" onClick={() => dispatch({ type: 'REVEAL_TURN' })}>
            I am {player.name}, start my turn
          </button>
        </div>
      </main>
    )
  }

  const node = board.nodes.find(n => n.id === player.position)!
  const planet = board.planets.find(p => p.id === node.planetId)!
  const connections = getConnections(board, player.position)
  const distanceToRebel =
    player.role === 'fascist' ? shortestDistance(board, player.position, rebel.position) : null

  function connectionNode(nodeId: string) {
    const n = board!.nodes.find(candidate => candidate.id === nodeId)!
    const p = board!.planets.find(candidate => candidate.id === n.planetId)!
    return { n, p }
  }

  function canAfford(mode: string): boolean {
    if (player.role === 'rebel') return true
    if (mode === 'warp') return player.warpTickets > 0
    if (mode === 'shuttle') return player.shuttleTickets > 0
    return true
  }

  return (
    <main className="view-game-board">
      <p className="round-indicator">
        Round {round} of {maxRounds}
      </p>
      <h2>{player.name}&apos;s turn</h2>
      <p className={`role-badge role-badge--${player.role}`}>
        {player.role === 'rebel' ? 'Rebel' : 'Space Fascist'}
      </p>

      <p className="current-location">
        Currently at <strong>{node.name}</strong>, {planet.name}
      </p>

      {player.role === 'fascist' && (
        <p className="distance-sense">
          The rebel is <strong>{distanceToRebel}</strong> hop{distanceToRebel === 1 ? '' : 's'} away.
        </p>
      )}

      {player.role === 'fascist' && (
        <p className="ticket-counts">
          Warp tickets: {player.warpTickets} &nbsp;|&nbsp; Shuttle tickets: {player.shuttleTickets}
        </p>
      )}
      {player.role === 'rebel' && <p className="ticket-counts">You travel free on every route.</p>}

      <fieldset className="move-options">
        <legend>Choose your move</legend>
        {connections.map(connection => {
          const { n, p } = connectionNode(connection.nodeId)
          const affordable = canAfford(connection.mode)
          return (
            <button
              key={connection.nodeId}
              className="btn-secondary move-option"
              disabled={!affordable}
              onClick={() => dispatch({ type: 'MOVE', nodeId: connection.nodeId })}
            >
              <span className="move-option__destination">
                {n.name} ({p.name})
              </span>
              <span className="move-option__mode">{MODE_LABELS[connection.mode]}</span>
              {!affordable && <span className="move-option__warning">No tickets left</span>}
            </button>
          )
        })}
      </fieldset>
    </main>
  )
}
