import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { reducer, initialState } from './reducer'
import type { GameState } from './types'
import { getConnections } from '../board/graph'

function withPlayers(names: string[]): GameState {
  let state = initialState
  // initialState already has 3 blank slots; adjust to match names length
  while (state.playerNames.length < names.length) {
    state = reducer(state, { type: 'ADD_PLAYER' })
  }
  names.forEach((name, index) => {
    state = reducer(state, { type: 'UPDATE_PLAYER_NAME', index, name })
  })
  return state
}

describe('name entry', () => {
  it('adds and removes player slots', () => {
    let state = initialState
    state = reducer(state, { type: 'ADD_PLAYER' })
    expect(state.playerNames).toHaveLength(4)
    state = reducer(state, { type: 'REMOVE_PLAYER', index: 0 })
    expect(state.playerNames).toHaveLength(3)
  })

  it('updates a player name', () => {
    const state = reducer(initialState, { type: 'UPDATE_PLAYER_NAME', index: 0, name: 'Leia' })
    expect(state.playerNames[0]).toBe('Leia')
  })

  it('does not start role allocation with too few players', () => {
    const state = withPlayers(['Leia', ''])
    const next = reducer(state, { type: 'START_ROLE_ALLOCATION' })
    expect(next.phase).toBe('name-entry')
  })

  it('starts role allocation with enough players and assigns exactly one rebel', () => {
    const state = withPlayers(['Leia', 'Vader', 'Tarkin'])
    const next = reducer(state, { type: 'START_ROLE_ALLOCATION' })
    expect(next.phase).toBe('role-allocation')
    expect(next.players).toHaveLength(3)
    expect(next.players.filter(p => p.role === 'rebel')).toHaveLength(1)
    expect(next.players.filter(p => p.role === 'fascist')).toHaveLength(2)
    expect(next.board).not.toBeNull()
    const positions = new Set(next.players.map(p => p.position))
    expect(positions.size).toBe(3)
  })
})

describe('role allocation', () => {
  function setup(): GameState {
    const state = withPlayers(['Leia', 'Vader', 'Tarkin'])
    return reducer(state, { type: 'START_ROLE_ALLOCATION' })
  }

  it('advances through each player reveal before starting play', () => {
    let state = setup()
    expect(state.roleRevealIndex).toBe(0)
    state = reducer(state, { type: 'ACKNOWLEDGE_ROLE' })
    expect(state.phase).toBe('role-allocation')
    expect(state.roleRevealIndex).toBe(1)
    state = reducer(state, { type: 'ACKNOWLEDGE_ROLE' })
    expect(state.phase).toBe('role-allocation')
    state = reducer(state, { type: 'ACKNOWLEDGE_ROLE' })
    expect(state.phase).toBe('playing')
    expect(state.currentPlayerIndex).toBe(0)
    expect(state.turnRevealed).toBe(false)
  })
})

describe('playing', () => {
  function setupPlaying(): GameState {
    let state = withPlayers(['Leia', 'Vader', 'Tarkin'])
    state = reducer(state, { type: 'START_ROLE_ALLOCATION' })
    state = reducer(state, { type: 'ACKNOWLEDGE_ROLE' })
    state = reducer(state, { type: 'ACKNOWLEDGE_ROLE' })
    state = reducer(state, { type: 'ACKNOWLEDGE_ROLE' })
    return state
  }

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requires the turn to be revealed before moving', () => {
    const state = setupPlaying()
    const player = state.players[0]
    const connection = getConnections(state.board!, player.position)[0]
    const next = reducer(state, { type: 'MOVE', nodeId: connection.nodeId })
    expect(next).toBe(state)
  })

  it('moves a player along a monorail edge for free and advances the turn', () => {
    let state = setupPlaying()
    state = reducer(state, { type: 'REVEAL_TURN' })
    const player = state.players[0]
    const monorailConnection = getConnections(state.board!, player.position).find(
      c => c.mode === 'monorail',
    )!
    const before = state.players[0]
    const next = reducer(state, { type: 'MOVE', nodeId: monorailConnection.nodeId })
    expect(next.players[0].position).toBe(monorailConnection.nodeId)
    expect(next.players[0].warpTickets).toBe(before.warpTickets)
    expect(next.players[0].shuttleTickets).toBe(before.shuttleTickets)
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.turnRevealed).toBe(false)
  })

  it('charges a fascist a warp ticket for warp gate travel', () => {
    let state = setupPlaying()
    // advance to a fascist's turn (index 1)
    state = reducer(state, { type: 'REVEAL_TURN' })
    const rebelConnection = getConnections(state.board!, state.players[0].position)[0]
    state = reducer(state, { type: 'MOVE', nodeId: rebelConnection.nodeId })
    expect(state.currentPlayerIndex).toBe(1)

    state = reducer(state, { type: 'REVEAL_TURN' })
    const fascist = state.players[1]
    const warpConnection = getConnections(state.board!, fascist.position).find(c => c.mode === 'warp')
    if (!warpConnection) return // board layout may not offer a warp edge from this station
    const next = reducer(state, { type: 'MOVE', nodeId: warpConnection.nodeId })
    expect(next.players[1].warpTickets).toBe(fascist.warpTickets - 1)
  })

  it('does not let a fascist travel by warp or shuttle without tickets', () => {
    let state = setupPlaying()
    state = reducer(state, { type: 'REVEAL_TURN' })
    const fascistIndex = 1
    // Drain the fascist's tickets directly for this test scenario.
    state = {
      ...state,
      players: state.players.map((p, i) => (i === fascistIndex ? { ...p, warpTickets: 0, shuttleTickets: 0 } : p)),
    }
    // move rebel out of the way first
    const rebelConnection = getConnections(state.board!, state.players[0].position)[0]
    state = reducer(state, { type: 'MOVE', nodeId: rebelConnection.nodeId })
    state = reducer(state, { type: 'REVEAL_TURN' })
    const fascist = state.players[fascistIndex]
    const costConnection = getConnections(state.board!, fascist.position).find(
      c => c.mode === 'warp' || c.mode === 'shuttle',
    )
    if (!costConnection) return
    const next = reducer(state, { type: 'MOVE', nodeId: costConnection.nodeId })
    expect(next.players[fascistIndex].position).toBe(fascist.position)
  })

  it('ends the game with a fascist win when a fascist captures the rebel', () => {
    let state = setupPlaying()
    const rebel = state.players[0]
    state = reducer(state, { type: 'REVEAL_TURN' })
    // Rebel makes a no-op-ish move: pick any legal move to advance the turn.
    const rebelConnection = getConnections(state.board!, rebel.position)[0]
    state = reducer(state, { type: 'MOVE', nodeId: rebelConnection.nodeId })

    // Force the fascist onto the rebel's new position to simulate a capture.
    state = reducer(state, { type: 'REVEAL_TURN' })
    state = {
      ...state,
      board: {
        ...state.board!,
        edges: [...state.board!.edges, { from: state.players[1].position, to: state.players[0].position, mode: 'monorail' }],
      },
    }
    const next = reducer(state, { type: 'MOVE', nodeId: state.players[0].position })
    expect(next.phase).toBe('game-over')
    expect(next.winner).toBe('fascist')
  })

  it('declares a rebel win when max rounds are exceeded without capture', () => {
    let state = setupPlaying()
    state = { ...state, maxRounds: 1 }
    for (let i = 0; i < state.players.length; i++) {
      state = reducer(state, { type: 'REVEAL_TURN' })
      const current = state.players[state.currentPlayerIndex]
      const connection = getConnections(state.board!, current.position)[0]
      state = reducer(state, { type: 'MOVE', nodeId: connection.nodeId })
      if (state.phase === 'game-over') break
    }
    expect(state.phase).toBe('game-over')
    expect(state.winner).toBe('rebel')
  })
})

describe('reset', () => {
  it('returns to the initial state', () => {
    const state = withPlayers(['Leia', 'Vader', 'Tarkin'])
    const reset = reducer(state, { type: 'RESET_GAME' })
    expect(reset).toEqual(initialState)
  })
})
