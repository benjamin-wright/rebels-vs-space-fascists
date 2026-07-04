export type TransportMode = 'monorail' | 'warp' | 'shuttle'

export interface Planet {
  id: string
  name: string
}

export interface BoardNode {
  id: string
  planetId: string
  name: string
  /** Local coordinates (0-1 range within the planet's own layout box), used for rendering. */
  x: number
  y: number
  /** Spaceport nodes are the endpoints of shuttle routes. */
  isSpaceport: boolean
}

export interface BoardEdge {
  from: string
  to: string
  mode: TransportMode
}

export interface Board {
  planets: Planet[]
  nodes: BoardNode[]
  edges: BoardEdge[]
}
