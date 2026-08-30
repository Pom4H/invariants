import { refKey, toRefIR } from './entity.js'
import type { AnyRef, GraphDefinition, RefIR } from './types.js'

export type LineageStep = Readonly<{
  phase: string
  source: RefIR
  target: RefIR
}>

/** Follow all forward projections reachable from a semantic identity. */
export function lineage(graph: GraphDefinition, source: AnyRef): readonly LineageStep[] {
  const queue = [refKey(source)]
  const seen = new Set(queue)
  const steps: LineageStep[] = []

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const projection of graph.projections ?? []) {
      if (refKey(projection.source) !== current) continue
      const targetKey = refKey(projection.target)
      steps.push(Object.freeze({
        phase: projection.phase,
        source: toRefIR(projection.source),
        target: toRefIR(projection.target)
      }))
      if (!seen.has(targetKey)) {
        seen.add(targetKey)
        queue.push(targetKey)
      }
    }
  }

  return Object.freeze(steps)
}
