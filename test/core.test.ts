import { describe, expect, test } from 'bun:test'
import {
  GraphValidationError,
  compileGraph,
  defineGraph,
  defineRelation,
  entity,
  fingerprint,
  invariant,
  issue,
  lineage,
  project,
  refKey,
  validateGraph,
  type AnyRelation
} from '../src/index.js'

describe('semantic graph', () => {
  test('compiles deterministically regardless of declaration order', async () => {
    const api = entity('app', 'api', { meta: { runtime: 'bun' } })
    const db = entity('app', 'db', { meta: { runtime: 'postgres' } })
    const dependsOn = defineRelation('depends-on', { from: 'app', to: 'app' })

    const a = defineGraph({ id: 'demo', entities: [api, db], relations: [dependsOn(api, db)] })
    const b = defineGraph({ id: 'demo', entities: [db, api], relations: [dependsOn(api, db)] })

    expect(compileGraph(a)).toEqual(compileGraph(b))
    expect(await fingerprint(a)).toBe(await fingerprint(b))
  })

  test('rejects duplicate identities', () => {
    const a = entity('app', 'api')
    const b = entity('app', 'api')
    const graph = defineGraph({ id: 'duplicate', entities: [a, b] })

    const report = validateGraph(graph)
    expect(report.ok).toBe(false)
    expect(report.issues[0]?.code).toBe('duplicate-identity')
    expect(() => compileGraph(graph)).toThrow(GraphValidationError)
  })

  test('rejects dangling relation references', () => {
    const api = entity('app', 'api')
    const db = entity('app', 'db')
    const dependsOn = defineRelation('depends-on', { from: 'app', to: 'app' })
    const graph = defineGraph({ id: 'dangling', entities: [api], relations: [dependsOn(api, db)] })

    expect(validateGraph(graph).issues.some((item) => item.code === 'dangling-reference')).toBe(true)
  })

  test('tracks lineage across multiple lifecycle phases', () => {
    const source = entity('signal', 'pump.running')
    const plc = entity('plc.input', '%IX0.0')
    const runtime = entity('runtime.signal', 'pump.running')
    const graph = defineGraph({
      id: 'lineage',
      entities: [source, plc, runtime],
      projections: [project('plc', source, plc), project('runtime', plc, runtime)]
    })

    expect(lineage(graph, source)).toEqual([
      { phase: 'plc', source: { kind: 'signal', id: 'pump.running' }, target: { kind: 'plc.input', id: '%IX0.0' } },
      { phase: 'runtime', source: { kind: 'plc.input', id: '%IX0.0' }, target: { kind: 'runtime.signal', id: 'pump.running' } }
    ])
  })

  test('supports graph-global domain invariants such as single writer', () => {
    const c1 = entity('controller', 'main')
    const c2 = entity('controller', 'backup')
    const start = entity('command', 'pump.start')
    const writes = defineRelation('writes', { from: 'controller', to: 'command' })

    const singleWriter = invariant('single-writer', ({ relations }) => {
      const seen = new Map<string, AnyRelation>()
      const problems = []
      for (const relation of relations.filter((item) => item.type === 'writes')) {
        const key = refKey(relation.to)
        const previous = seen.get(key)
        if (previous) problems.push(issue('single-writer', 'multiple-writers', key, previous.from, relation.from, relation.to))
        else seen.set(key, relation)
      }
      return problems
    })

    const graph = defineGraph({
      id: 'writers',
      entities: [c1, c2, start],
      relations: [writes(c1, start), writes(c2, start)],
      invariants: [singleWriter]
    })

    const report = validateGraph(graph)
    expect(report.ok).toBe(false)
    expect(report.issues[0]?.invariant).toBe('single-writer')
    expect(report.issues[0]?.code).toBe('multiple-writers')
  })
})
