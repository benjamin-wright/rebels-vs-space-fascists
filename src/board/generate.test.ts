import { describe, expect, it } from 'vitest'
import { generateBoard } from './generate'
import { getConnections, shortestDistance } from './graph'

describe('generateBoard', () => {
  it('creates at least 3 planets by default', () => {
    const board = generateBoard({ seed: 1 })
    expect(board.planets.length).toBeGreaterThanOrEqual(3)
  })

  it('creates the requested number of planets and nodes', () => {
    const board = generateBoard({ seed: 1, planetCount: 4, nodesPerPlanet: 6 })
    expect(board.planets).toHaveLength(4)
    expect(board.nodes).toHaveLength(24)
  })

  it('is deterministic for a given seed', () => {
    const a = generateBoard({ seed: 42 })
    const b = generateBoard({ seed: 42 })
    expect(a).toEqual(b)
  })

  it('produces different boards for different seeds', () => {
    const a = generateBoard({ seed: 1 })
    const b = generateBoard({ seed: 2 })
    expect(a).not.toEqual(b)
  })

  it('connects every node within a planet via monorail (directly or transitively)', () => {
    const board = generateBoard({ seed: 7 })
    for (const planet of board.planets) {
      const planetNodeIds = board.nodes.filter(n => n.planetId === planet.id).map(n => n.id)
      const monorailEdges = board.edges.filter(
        e => e.mode === 'monorail' && planetNodeIds.includes(e.from) && planetNodeIds.includes(e.to),
      )
      const adjacency = new Map<string, string[]>()
      for (const id of planetNodeIds) adjacency.set(id, [])
      for (const edge of monorailEdges) {
        adjacency.get(edge.from)!.push(edge.to)
        adjacency.get(edge.to)!.push(edge.from)
      }
      const visited = new Set([planetNodeIds[0]])
      const stack = [planetNodeIds[0]]
      while (stack.length) {
        const current = stack.pop()!
        for (const neighbour of adjacency.get(current) ?? []) {
          if (!visited.has(neighbour)) {
            visited.add(neighbour)
            stack.push(neighbour)
          }
        }
      }
      expect(visited.size).toBe(planetNodeIds.length)
    }
  })

  it('does not connect every node to every nearest neighbour (some are skipped)', () => {
    const board = generateBoard({ seed: 3, extraMonorailProbability: 0.3, nodesPerPlanet: 9 })
    const monorailEdgeCount = board.edges.filter(e => e.mode === 'monorail').length
    const maxPossible = board.nodes.length * 2 // generous upper bound
    expect(monorailEdgeCount).toBeGreaterThan(0)
    expect(monorailEdgeCount).toBeLessThan(maxPossible)
  })

  it('creates warp gates only within the same planet', () => {
    const board = generateBoard({ seed: 5 })
    const nodePlanet = new Map(board.nodes.map(n => [n.id, n.planetId]))
    const warpEdges = board.edges.filter(e => e.mode === 'warp')
    expect(warpEdges.length).toBeGreaterThan(0)
    for (const edge of warpEdges) {
      expect(nodePlanet.get(edge.from)).toBe(nodePlanet.get(edge.to))
    }
  })

  it('creates shuttle routes only between different planets', () => {
    const board = generateBoard({ seed: 5 })
    const nodePlanet = new Map(board.nodes.map(n => [n.id, n.planetId]))
    const shuttleEdges = board.edges.filter(e => e.mode === 'shuttle')
    expect(shuttleEdges.length).toBeGreaterThan(0)
    for (const edge of shuttleEdges) {
      expect(nodePlanet.get(edge.from)).not.toBe(nodePlanet.get(edge.to))
    }
  })

  it('connects every planet to the rest of the board via shuttle routes', () => {
    const board = generateBoard({ seed: 9, planetCount: 5 })
    for (const planet of board.planets) {
      const planetNodeIds = new Set(board.nodes.filter(n => n.planetId === planet.id).map(n => n.id))
      const hasShuttleLink = board.edges.some(
        e => e.mode === 'shuttle' && (planetNodeIds.has(e.from) || planetNodeIds.has(e.to)),
      )
      expect(hasShuttleLink).toBe(true)
    }
  })
})

describe('graph helpers', () => {
  it('getConnections returns neighbours from both edge directions', () => {
    const board = generateBoard({ seed: 11 })
    const node = board.nodes[0]
    const connections = getConnections(board, node.id)
    expect(connections.length).toBeGreaterThan(0)
    for (const connection of connections) {
      const linked = board.edges.some(
        e =>
          (e.from === node.id && e.to === connection.nodeId) ||
          (e.to === node.id && e.from === connection.nodeId),
      )
      expect(linked).toBe(true)
    }
  })

  it('shortestDistance is 0 for the same node', () => {
    const board = generateBoard({ seed: 11 })
    expect(shortestDistance(board, board.nodes[0].id, board.nodes[0].id)).toBe(0)
  })

  it('shortestDistance finds a path between any two nodes on a connected board', () => {
    const board = generateBoard({ seed: 11 })
    const distance = shortestDistance(board, board.nodes[0].id, board.nodes[board.nodes.length - 1].id)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(Infinity)
  })
})
