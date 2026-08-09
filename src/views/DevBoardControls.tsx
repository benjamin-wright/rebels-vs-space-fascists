import { useState } from 'react'
import type { Dispatch } from 'react'
import type { Action } from '../state/types'
import { generateBoard } from '../board/generate'
import type { Board } from '../board/types'
import PlanetMap from './PlanetMap'

interface Props {
  dispatch: Dispatch<Action>
}

export default function DevBoardControls({ dispatch }: Props) {
  const [planetCount, setPlanetCount] = useState(3)
  const [nodesPerPlanet, setNodesPerPlanet] = useState(7)
  const [extraMonorailProbability, setExtraMonorailProbability] = useState(0.5)
  const [spread, setSpread] = useState(0.5)
  const [previewBoard, setPreviewBoard] = useState<Board | null>(null)
  const [previewPlanetIndex, setPreviewPlanetIndex] = useState(0)

  function buildOptions() {
    return { planetCount, nodesPerPlanet, extraMonorailProbability, spread }
  }

  function handlePreview() {
    const board = generateBoard(buildOptions())
    setPreviewBoard(board)
    setPreviewPlanetIndex(0)
  }

  function handleStart() {
    dispatch({
      type: 'START_ROLE_ALLOCATION_WITH_OPTIONS',
      ...buildOptions(),
    })
  }

  const previewPlanetId = previewBoard?.planets[previewPlanetIndex]?.id ?? ''

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
        <label className="dev-field">
          <span>Station spread: {Math.round(spread * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={spread}
            onChange={e => setSpread(Number(e.target.value))}
          />
        </label>

        <div className="dev-panel__actions">
          <button type="button" className="btn-secondary" onClick={handlePreview}>
            Preview map
          </button>
          <button type="button" className="btn-primary dev-panel__launch" onClick={handleStart}>
            Generate board &amp; allocate roles
          </button>
        </div>

        {previewBoard && (
          <div className="dev-preview">
            <div className="planet-tabs">
              {previewBoard.planets.map((planet, i) => (
                <button
                  key={planet.id}
                  type="button"
                  className={`planet-tab${i === previewPlanetIndex ? ' planet-tab--active' : ''}`}
                  onClick={() => setPreviewPlanetIndex(i)}
                >
                  {planet.name}
                </button>
              ))}
            </div>
            <PlanetMap
              board={previewBoard}
              planetId={previewPlanetId}
              visiblePlayers={[]}
              currentPlayerPosition=""
            />
          </div>
        )}
      </div>
    </details>
  )
}
