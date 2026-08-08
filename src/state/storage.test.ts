// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadState, saveState } from './storage'
import { initialState } from './reducer'
import type { GameState } from './types'

const sampleState: GameState = {
  phase: 'playing',
  board: { planets: [], nodes: [], edges: [] },
  playerNames: ['Leia', 'Vader', 'Tarkin'],
  players: [
    { name: 'Leia', role: 'rebel', position: 'planet-0-node-0', warpTickets: 2, shuttleTickets: 2 },
    { name: 'Vader', role: 'fascist', position: 'planet-0-node-1', warpTickets: 2, shuttleTickets: 2 },
    { name: 'Tarkin', role: 'fascist', position: 'planet-1-node-0', warpTickets: 2, shuttleTickets: 2 },
  ],
  currentPlayerIndex: 0,
  round: 1,
  maxRounds: 15,
  roleRevealIndex: 0,
  turnRevealed: false,
  winner: null,
}

describe('loadState', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns initialState when nothing is stored', () => {
    expect(loadState()).toEqual(initialState)
  })

  it('returns parsed state when valid JSON is stored', () => {
    localStorage.setItem('rebels-vs-space-fascists-state', JSON.stringify(sampleState))
    expect(loadState()).toEqual(sampleState)
  })

  it('returns initialState when stored value is invalid JSON', () => {
    localStorage.setItem('rebels-vs-space-fascists-state', 'not-json')
    expect(loadState()).toEqual(initialState)
  })
})

describe('saveState', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('serialises state to localStorage', () => {
    saveState(sampleState)
    expect(localStorage.getItem('rebels-vs-space-fascists-state')).toBe(JSON.stringify(sampleState))
  })

  it('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveState(sampleState)).not.toThrow()
  })
})
