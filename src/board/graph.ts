import type { Board, BoardEdge, TransportMode } from './types'

export interface Connection {
  nodeId: string
  mode: TransportMode
}

/** Returns all nodes directly reachable from the given node, along with the mode of transport used. */
export function getConnections(board: Board, nodeId: string): Connection[] {
  const connections: Connection[] = []
  for (const edge of board.edges) {
    if (edge.from === nodeId) connections.push({ nodeId: edge.to, mode: edge.mode })
    else if (edge.to === nodeId) connections.push({ nodeId: edge.from, mode: edge.mode })
  }
  return connections
}

function buildAdjacency(edges: BoardEdge[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, [])
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, [])
    adjacency.get(edge.from)!.push(edge.to)
    adjacency.get(edge.to)!.push(edge.from)
  }
  return adjacency
}

/** Computes the shortest path distance (in number of hops, across any transport mode) between two nodes. */
export function shortestDistance(board: Board, fromId: string, toId: string): number {
  if (fromId === toId) return 0
  const adjacency = buildAdjacency(board.edges)
  const visited = new Set<string>([fromId])
  let frontier = [fromId]
  let distance = 0

  while (frontier.length > 0) {
    distance += 1
    const next: string[] = []
    for (const nodeId of frontier) {
      for (const neighbour of adjacency.get(nodeId) ?? []) {
        if (visited.has(neighbour)) continue
        if (neighbour === toId) return distance
        visited.add(neighbour)
        next.push(neighbour)
      }
    }
    frontier = next
  }

  return Infinity
}
