import type { Board } from '../board/types'

export type GamePhase = 'name-entry' | 'role-allocation' | 'playing' | 'game-over'

export type Role = 'rebel' | 'fascist'

export interface PlayerState {
  name: string
  role: Role
  position: string
  warpTickets: number
  shuttleTickets: number
}

export interface GameState {
  phase: GamePhase
  board: Board | null
  playerNames: string[]
  players: PlayerState[]
  currentPlayerIndex: number
  round: number
  maxRounds: number
  /** Index of the player whose role is currently being revealed during hand-off. */
  roleRevealIndex: number
  /** Whether the current player's turn controls are unlocked (after tapping "it's my turn"). */
  turnRevealed: boolean
  winner: Role | null
}

export const STARTING_WARP_TICKETS = 2
export const STARTING_SHUTTLE_TICKETS = 2
export const DEFAULT_MAX_ROUNDS = 15
export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 8

export type Action =
  | { type: 'ADD_PLAYER' }
  | { type: 'REMOVE_PLAYER'; index: number }
  | { type: 'UPDATE_PLAYER_NAME'; index: number; name: string }
  | { type: 'START_ROLE_ALLOCATION' }
  | { type: 'ACKNOWLEDGE_ROLE' }
  | { type: 'REVEAL_TURN' }
  | { type: 'MOVE'; nodeId: string }
  | { type: 'RESET_GAME' }
