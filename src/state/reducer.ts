import { generateBoard } from '../board/generate'
import { getConnections } from '../board/graph'
import type {
  Action,
  GameState,
  PlayerState,
} from './types'
import {
  DEFAULT_MAX_ROUNDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  STARTING_SHUTTLE_TICKETS,
  STARTING_WARP_TICKETS,
} from './types'

export const initialState: GameState = {
  phase: 'name-entry',
  board: null,
  playerNames: ['', '', ''],
  players: [],
  currentPlayerIndex: 0,
  round: 1,
  maxRounds: DEFAULT_MAX_ROUNDS,
  roleRevealIndex: 0,
  turnRevealed: false,
  winner: null,
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function startRoleAllocation(state: GameState, options?: { planetCount?: number; nodesPerPlanet?: number; extraMonorailProbability?: number; spread?: number }): GameState {
  const names = state.playerNames.map(n => n.trim()).filter(Boolean)
  if (names.length < MIN_PLAYERS) return state

  const board = generateBoard(options)
  const shuffledNames = shuffle(names)
  const shuffledNodeIds = shuffle(board.nodes.map(n => n.id)).slice(0, shuffledNames.length)

  const players: PlayerState[] = shuffledNames.map((name, index) => ({
    name,
    role: index === 0 ? 'rebel' : 'fascist',
    position: shuffledNodeIds[index],
    warpTickets: STARTING_WARP_TICKETS,
    shuttleTickets: STARTING_SHUTTLE_TICKETS,
  }))

  return {
    ...state,
    phase: 'role-allocation',
    board,
    players,
    roleRevealIndex: 0,
  }
}

function acknowledgeRole(state: GameState): GameState {
  if (state.phase !== 'role-allocation') return state
  const nextIndex = state.roleRevealIndex + 1
  if (nextIndex >= state.players.length) {
    return {
      ...state,
      phase: 'playing',
      currentPlayerIndex: 0,
      round: 1,
      turnRevealed: false,
    }
  }
  return { ...state, roleRevealIndex: nextIndex }
}

function move(state: GameState, nodeId: string): GameState {
  if (state.phase !== 'playing' || !state.turnRevealed || !state.board) return state

  const player = state.players[state.currentPlayerIndex]
  const connections = getConnections(state.board, player.position)
  const connection = connections.find(c => c.nodeId === nodeId)
  if (!connection) return state

  const isRebel = player.role === 'rebel'
  let warpTickets = player.warpTickets
  let shuttleTickets = player.shuttleTickets

  if (!isRebel) {
    if (connection.mode === 'warp') {
      if (warpTickets <= 0) return state
      warpTickets -= 1
    } else if (connection.mode === 'shuttle') {
      if (shuttleTickets <= 0) return state
      shuttleTickets -= 1
    }
  }

  const updatedPlayer: PlayerState = { ...player, position: nodeId, warpTickets, shuttleTickets }
  const players = state.players.map((p, i) => (i === state.currentPlayerIndex ? updatedPlayer : p))

  const rebel = players.find(p => p.role === 'rebel')!
  if (!isRebel && updatedPlayer.position === rebel.position) {
    return { ...state, players, phase: 'game-over', winner: 'fascist' }
  }

  const nextPlayerIndex = (state.currentPlayerIndex + 1) % players.length
  const wrappedRound = nextPlayerIndex === 0
  const nextRound = wrappedRound ? state.round + 1 : state.round

  if (wrappedRound && nextRound > state.maxRounds) {
    return { ...state, players, phase: 'game-over', winner: 'rebel' }
  }

  return {
    ...state,
    players,
    currentPlayerIndex: nextPlayerIndex,
    round: nextRound,
    turnRevealed: false,
  }
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'ADD_PLAYER':
      if (state.phase !== 'name-entry' || state.playerNames.length >= MAX_PLAYERS) return state
      return { ...state, playerNames: [...state.playerNames, ''] }

    case 'REMOVE_PLAYER':
      if (state.phase !== 'name-entry' || state.playerNames.length <= 1) return state
      return { ...state, playerNames: state.playerNames.filter((_, i) => i !== action.index) }

    case 'UPDATE_PLAYER_NAME':
      if (state.phase !== 'name-entry') return state
      return {
        ...state,
        playerNames: state.playerNames.map((n, i) => (i === action.index ? action.name : n)),
      }

    case 'START_ROLE_ALLOCATION':
      if (state.phase !== 'name-entry') return state
      return startRoleAllocation(state)

    case 'START_ROLE_ALLOCATION_WITH_OPTIONS':
      if (state.phase !== 'name-entry') return state
      return startRoleAllocation(state, {
        planetCount: action.planetCount,
        nodesPerPlanet: action.nodesPerPlanet,
        extraMonorailProbability: action.extraMonorailProbability,
        spread: action.spread,
      })

    case 'ACKNOWLEDGE_ROLE':
      return acknowledgeRole(state)

    case 'REVEAL_TURN':
      if (state.phase !== 'playing' || state.turnRevealed) return state
      return { ...state, turnRevealed: true }

    case 'MOVE':
      return move(state, action.nodeId)

    case 'RESET_GAME':
      return initialState

    default:
      return state
  }
}
