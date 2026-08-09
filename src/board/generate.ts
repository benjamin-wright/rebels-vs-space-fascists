import type { Board, BoardEdge, BoardNode, Planet } from './types'

/** Deterministic PRNG (mulberry32) so boards can be reproduced from a seed for tests. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface GenerateBoardOptions {
  /** Number of planets to generate (minimum 3). */
  planetCount?: number
  /** Number of stations per planet. */
  nodesPerPlanet?: number
  /** Probability of keeping an extra nearest-neighbour monorail link beyond the guaranteed spanning tree. */
  extraMonorailProbability?: number
  /**
   * How far apart stations are spread (0–1). Higher values push stations apart via
   * a Poisson-disc-like rejection step so they don't cluster.
   */
  spread?: number
  /** Seed for deterministic generation; defaults to a random seed. */
  seed?: number
}

const PLANET_NAMES = [
  'Kessara Prime',
  'Voidreach',
  'Ashkar Minor',
  'Halcyon Belt',
  'Drevik Station',
  'Nym Outpost',
]

const DEFAULT_OPTIONS: Required<GenerateBoardOptions> = {
  planetCount: 3,
  nodesPerPlanet: 7,
  extraMonorailProbability: 0.5,
  spread: 0.5,
  seed: Date.now(),
}

function distance(a: BoardNode, b: BoardNode): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/** Builds a minimum spanning tree over the given nodes using Prim's algorithm, guaranteeing connectivity. */
function minimumSpanningTree(nodes: BoardNode[]): BoardEdge[] {
  if (nodes.length <= 1) return []
  const inTree = new Set<string>([nodes[0].id])
  const edges: BoardEdge[] = []

  while (inTree.size < nodes.length) {
    let best: { from: string; to: string; dist: number } | null = null
    for (const node of nodes) {
      if (!inTree.has(node.id)) continue
      for (const other of nodes) {
        if (inTree.has(other.id)) continue
        const d = distance(node, other)
        if (!best || d < best.dist) {
          best = { from: node.id, to: other.id, dist: d }
        }
      }
    }
    if (!best) break
    inTree.add(best.to)
    edges.push({ from: best.from, to: best.to, mode: 'monorail' })
  }

  return edges
}

/**
 * Places `count` points in [0,1]×[0,1] using a simple rejection approach:
 * each candidate is kept only if it is at least `minDist` away from all
 * already-placed points. Up to `maxAttempts` candidates are tried per point;
 * if none passes the test the best-effort fallback (furthest candidate) is used.
 */
function spreadPoints(
  rand: () => number,
  count: number,
  minDist: number,
): Array<{ x: number; y: number }> {
  const placed: Array<{ x: number; y: number }> = []
  const maxAttempts = 30

  for (let i = 0; i < count; i++) {
    let best: { x: number; y: number } | null = null
    let bestMinDist = -1

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = { x: rand(), y: rand() }
      const nearest = placed.reduce((min, p) => {
        const d = Math.hypot(candidate.x - p.x, candidate.y - p.y)
        return d < min ? d : min
      }, Infinity)

      if (nearest >= minDist) {
        best = candidate
        break
      }
      if (nearest > bestMinDist) {
        bestMinDist = nearest
        best = candidate
      }
    }

    placed.push(best!)
  }

  return placed
}

/** Generates a 2D graph "board" made of several planets linked by shuttle routes. */
export function generateBoard(options: GenerateBoardOptions = {}): Board {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const planetCount = Math.max(3, opts.planetCount)
  const nodesPerPlanet = Math.max(4, opts.nodesPerPlanet)
  const spread = Math.max(0, Math.min(1, opts.spread))
  const rand = mulberry32(opts.seed)

  // Minimum distance between nodes: 0 spread → 0, 1 spread → 1/sqrt(nodesPerPlanet)
  const minDist = spread / Math.sqrt(nodesPerPlanet)

  const planets: Planet[] = []
  const nodes: BoardNode[] = []
  const nodesByPlanet: BoardNode[][] = []

  for (let p = 0; p < planetCount; p++) {
    const planet: Planet = {
      id: `planet-${p}`,
      name: PLANET_NAMES[p % PLANET_NAMES.length],
    }
    planets.push(planet)

    const points = spreadPoints(rand, nodesPerPlanet, minDist)
    const planetNodes: BoardNode[] = points.map((pt, n) => ({
      id: `${planet.id}-node-${n}`,
      planetId: planet.id,
      name: `Station ${n + 1}`,
      x: pt.x,
      y: pt.y,
      isSpaceport: false,
    }))
    nodesByPlanet.push(planetNodes)
    nodes.push(...planetNodes)
  }

  const edges: BoardEdge[] = []
  const edgeSet = new Set<string>()

  function addEdge(edge: BoardEdge) {
    const key = edgeKey(edge.from, edge.to)
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    edges.push(edge)
  }

  // Monorail: guarantee connectivity within each planet via a spanning tree, then
  // sprinkle in extra nearest-neighbour links so most (but not all) stations connect
  // to their closest neighbours.
  for (const planetNodes of nodesByPlanet) {
    for (const edge of minimumSpanningTree(planetNodes)) {
      addEdge(edge)
    }

    for (const node of planetNodes) {
      const neighbours = planetNodes
        .filter(other => other.id !== node.id)
        .sort((a, b) => distance(node, a) - distance(node, b))
        .slice(0, 3)

      for (const neighbour of neighbours) {
        if (rand() < opts.extraMonorailProbability) {
          addEdge({ from: node.id, to: neighbour.id, mode: 'monorail' })
        }
      }
    }
  }

  // Warp gates: connect the most distant pair(s) of stations on the same planet for
  // long-distance travel.
  for (const planetNodes of nodesByPlanet) {
    let farthest: { from: string; to: string; dist: number } | null = null
    for (let i = 0; i < planetNodes.length; i++) {
      for (let j = i + 1; j < planetNodes.length; j++) {
        const d = distance(planetNodes[i], planetNodes[j])
        if (!farthest || d > farthest.dist) {
          farthest = { from: planetNodes[i].id, to: planetNodes[j].id, dist: d }
        }
      }
    }
    if (farthest) {
      addEdge({ from: farthest.from, to: farthest.to, mode: 'warp' })
    }
  }

  // Shuttles: designate one or two spaceport stations per planet and connect them to
  // spaceports on other planets, forming a ring so every planet is reachable.
  const spaceportsByPlanet: BoardNode[][] = nodesByPlanet.map(planetNodes => {
    const count = planetNodes.length >= 6 ? 2 : 1
    const centroidX = planetNodes.reduce((sum, n) => sum + n.x, 0) / planetNodes.length
    const centroidY = planetNodes.reduce((sum, n) => sum + n.y, 0) / planetNodes.length
    const sorted = [...planetNodes].sort(
      (a, b) =>
        Math.hypot(a.x - centroidX, a.y - centroidY) - Math.hypot(b.x - centroidX, b.y - centroidY),
    )
    return sorted.slice(0, count)
  })

  for (const spaceports of spaceportsByPlanet) {
    for (const spaceport of spaceports) {
      spaceport.isSpaceport = true
    }
  }

  for (let p = 0; p < planetCount; p++) {
    const nextP = (p + 1) % planetCount
    const from = spaceportsByPlanet[p][0]
    const to = spaceportsByPlanet[nextP][0]
    addEdge({ from: from.id, to: to.id, mode: 'shuttle' })
  }
  // Give planets with a second spaceport an extra cross-link for redundancy.
  for (let p = 0; p < planetCount; p++) {
    if (spaceportsByPlanet[p].length < 2) continue
    const targetP = (p + 2) % planetCount
    const from = spaceportsByPlanet[p][1]
    const to = spaceportsByPlanet[targetP][spaceportsByPlanet[targetP].length - 1]
    if (from.id !== to.id) {
      addEdge({ from: from.id, to: to.id, mode: 'shuttle' })
    }
  }

  return { planets, nodes, edges }
}
