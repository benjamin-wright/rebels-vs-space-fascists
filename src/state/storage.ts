import type { GameState } from './types'
import { initialState } from './reducer'

const STORAGE_KEY = 'rebels-vs-space-fascists-state'

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as GameState
    return parsed
  } catch {
    return initialState
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore write errors (e.g. private-browsing quota exceeded)
  }
}
