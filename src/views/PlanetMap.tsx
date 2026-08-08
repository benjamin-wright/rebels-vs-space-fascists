import type { Board, BoardNode } from '../board/types'
import type { PlayerState } from '../state/types'

interface VisiblePlayer {
  player: PlayerState
  isCurrent: boolean
}

interface Props {
  board: Board
  planetId: string
  visiblePlayers: VisiblePlayer[]
  currentPlayerPosition: string
}

const SVG_SIZE = 400
const PADDING = 36
const PLOT_SIZE = SVG_SIZE - PADDING * 2

function toSvg(v: number): number {
  return PADDING + v * PLOT_SIZE
}

/** Returns the destination planet name(s) reachable via shuttle from a given node. */
function shuttleDestinations(board: Board, nodeId: string): string[] {
  const names: string[] = []
  for (const edge of board.edges) {
    if (edge.mode !== 'shuttle') continue
    let otherId: string | null = null
    if (edge.from === nodeId) otherId = edge.to
    else if (edge.to === nodeId) otherId = edge.from
    if (!otherId) continue
    const otherNode = board.nodes.find(n => n.id === otherId)
    if (!otherNode) continue
    const planet = board.planets.find(p => p.id === otherNode.planetId)
    if (planet) names.push(planet.name)
  }
  return names
}

export default function PlanetMap({ board, planetId, visiblePlayers, currentPlayerPosition }: Props) {
  const planetNodes = board.nodes.filter(n => n.planetId === planetId)
  const planetNodeIds = new Set(planetNodes.map(n => n.id))

  // Only include intra-planet edges for monorail/warp
  const intraEdges = board.edges.filter(
    e => e.mode !== 'shuttle' && planetNodeIds.has(e.from) && planetNodeIds.has(e.to),
  )

  const nodeMap = new Map<string, BoardNode>(board.nodes.map(n => [n.id, n]))

  return (
    <svg
      className="planet-map"
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      aria-label="Planet map"
    >
      {/* Edge lines */}
      {intraEdges.map((edge, i) => {
        const a = nodeMap.get(edge.from)!
        const b = nodeMap.get(edge.to)!
        const x1 = toSvg(a.x)
        const y1 = toSvg(a.y)
        const x2 = toSvg(b.x)
        const y2 = toSvg(b.y)
        if (edge.mode === 'monorail') {
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className="map-edge map-edge--monorail"
            />
          )
        }
        // warp
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            className="map-edge map-edge--warp"
          />
        )
      })}

      {/* Nodes */}
      {planetNodes.map(node => {
        const cx = toSvg(node.x)
        const cy = toSvg(node.y)
        const isCurrent = node.id === currentPlayerPosition
        const dests = node.isSpaceport ? shuttleDestinations(board, node.id) : []

        return (
          <g key={node.id}>
            {/* Glow ring for current position */}
            {isCurrent && (
              <circle
                cx={cx} cy={cy} r={14}
                className="map-node-glow"
              />
            )}
            {/* Spaceport outer ring */}
            {node.isSpaceport && (
              <circle
                cx={cx} cy={cy} r={10}
                className="map-node-spaceport-ring"
              />
            )}
            {/* Main node circle */}
            <circle
              cx={cx} cy={cy} r={6}
              className={`map-node${node.isSpaceport ? ' map-node--spaceport' : ''}`}
            />
            {/* Node name label */}
            <text
              x={cx} y={cy - 14}
              className="map-label"
              textAnchor="middle"
            >
              {node.name}
            </text>
            {/* Shuttle destination annotations */}
            {dests.map((dest, di) => (
              <text
                key={di}
                x={cx} y={cy + 22 + di * 12}
                className="map-label map-label--shuttle"
                textAnchor="middle"
              >
                → {dest}
              </text>
            ))}
          </g>
        )
      })}

      {/* Player tokens */}
      {visiblePlayers.map(({ player, isCurrent }) => {
        const node = nodeMap.get(player.position)
        if (!node || node.planetId !== planetId) return null
        const cx = toSvg(node.x)
        const cy = toSvg(node.y)
        const role = player.role
        return (
          <circle
            key={player.name}
            cx={cx}
            cy={cy}
            r={5}
            className={`map-token map-token--${role}${isCurrent ? ' map-token--current' : ''}`}
          />
        )
      })}
    </svg>
  )
}
