import { useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../state/types'
import { getConnections, shortestDistance } from '../board/graph'
import PlanetMap from './PlanetMap'

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

  const player = board ? players[currentPlayerIndex] : null
  const defaultPlanetId = player && board
    ? board.nodes.find(n => n.id === player.position)?.planetId ?? ''
    : ''

  // Track per-player planet view. Reset to current planet when player index changes.
  const [viewState, setViewState] = useState<{ playerIndex: number; planetId: string }>({
    playerIndex: currentPlayerIndex,
    planetId: defaultPlanetId,
  })

  const viewedPlanetId =
    viewState.playerIndex === currentPlayerIndex ? viewState.planetId : defaultPlanetId

  function setViewedPlanetId(planetId: string) {
    setViewState({ playerIndex: currentPlayerIndex, planetId })
  }

  if (!board || !player) return null

  const p = player  // non-null alias for use inside closures
  const rebel = players.find(r => r.role === 'rebel')!

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
        <button
          className="btn-ghost exit-game"
          onClick={() => dispatch({ type: 'RESET_GAME' })}
        >
          ✕ Exit game
        </button>
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
    if (p.role === 'rebel') return true
    if (mode === 'warp') return p.warpTickets > 0
    if (mode === 'shuttle') return p.shuttleTickets > 0
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

      {/* Planet tab switcher — rebels can switch; fascists are locked to their planet */}
      {player.role === 'rebel' && (
        <div className="planet-tabs" role="tablist" aria-label="Select planet">
          {board.planets.map(p => (
            <button
              key={p.id}
              role="tab"
              aria-selected={viewedPlanetId === p.id}
              className={`planet-tab${viewedPlanetId === p.id ? ' planet-tab--active' : ''}`}
              onClick={() => setViewedPlanetId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* SVG map */}
      <PlanetMap
        board={board}
        planetId={player.role === 'rebel' ? viewedPlanetId : node.planetId}
        currentPlayerPosition={player.position}
        visiblePlayers={players
          .filter(
            p =>
              player.role === 'rebel' ||
              board.nodes.find(n => n.id === p.position)?.planetId === node.planetId,
          )
          .map(p => ({ player: p, isCurrent: p === player }))}
      />

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

      <button
        className="btn-ghost exit-game"
        onClick={() => dispatch({ type: 'RESET_GAME' })}
      >
        ✕ Exit game
      </button>
    </main>
  )
}
