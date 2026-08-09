import { useState } from 'react'
import type { Dispatch } from 'react'
import type { Action } from '../state/types'

interface Props {
  dispatch: Dispatch<Action>
}

export default function DevBoardControls({ dispatch }: Props) {
  const [planetCount, setPlanetCount] = useState(3)
  const [nodesPerPlanet, setNodesPerPlanet] = useState(7)
  const [extraMonorailProbability, setExtraMonorailProbability] = useState(0.5)

  function handleStart() {
    dispatch({
      type: 'START_ROLE_ALLOCATION_WITH_OPTIONS',
      planetCount,
      nodesPerPlanet,
      extraMonorailProbability,
    })
  }

  return (
    <details className="dev-panel">
      <summary className="dev-panel__summary">⚙ Dev: Board parameters</summary>
      <div className="dev-panel__body">
        <label className="dev-field">
          <span>Planets: {planetCount}</span>
          <input
            type="range"
            min={3}
            max={6}
            step={1}
            value={planetCount}
            onChange={e => setPlanetCount(Number(e.target.value))}
          />
        </label>
        <label className="dev-field">
          <span>Stations per planet: {nodesPerPlanet}</span>
          <input
            type="range"
            min={4}
            max={14}
            step={1}
            value={nodesPerPlanet}
            onChange={e => setNodesPerPlanet(Number(e.target.value))}
          />
        </label>
        <label className="dev-field">
          <span>Extra monorail density: {Math.round(extraMonorailProbability * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={extraMonorailProbability}
            onChange={e => setExtraMonorailProbability(Number(e.target.value))}
          />
        </label>
        <button type="button" className="btn-primary dev-panel__launch" onClick={handleStart}>
          Generate board &amp; allocate roles
        </button>
      </div>
    </details>
  )
}
