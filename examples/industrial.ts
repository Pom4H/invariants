import {
  defineGraph,
  defineRelation,
  entity,
  fingerprint,
  invariant,
  issue,
  project,
  refKey,
  type AnyRelation,
  type Entity
} from '../src/index.js'

type Medium = 'water' | 'air'
type Direction = 'in' | 'out'
type Port<D extends Direction, M extends Medium, I extends string = string> = Entity<
  'port',
  I,
  { direction: D; medium: M; owner: string }
>

function port<
  const Owner extends string,
  const Name extends string,
  const D extends Direction,
  const M extends Medium
>(owner: Owner, name: Name, direction: D, medium: M) {
  return entity('port', `${owner}.${name}` as const, { meta: { owner, direction, medium } })
}

function pump<const Id extends string>(id: Id) {
  const root = entity('equipment', id, { meta: { equipmentType: 'pump' } })
  const inlet = port(id, 'in', 'in', 'water')
  const outlet = port(id, 'out', 'out', 'water')
  const running = entity('signal', `${id}.running` as const, {
    meta: { owner: id, valueType: 'boolean', semantic: 'running' }
  })
  const flow = entity('signal', `${id}.flow` as const, {
    meta: { owner: id, valueType: 'number', quantity: 'flow', unit: 'm3/h' }
  })
  const start = entity('command', `${id}.start` as const, {
    meta: { owner: id, valueType: 'boolean', semantic: 'start' }
  })
  return { root, in: inlet, out: outlet, running, flow, start, entities: [root, inlet, outlet, running, flow, start] } as const
}

function tank<const Id extends string>(id: Id) {
  const root = entity('equipment', id, { meta: { equipmentType: 'tank' } })
  const outlet = port(id, 'out', 'out', 'water')
  return { root, out: outlet, entities: [root, outlet] } as const
}

function pressureSensor<const Id extends string>(id: Id) {
  const root = entity('equipment', id, { meta: { equipmentType: 'pressure-sensor' } })
  const inlet = port(id, 'process', 'in', 'water')
  const value = entity('signal', `${id}.value` as const, {
    meta: { owner: id, valueType: 'number', quantity: 'pressure', unit: 'bar' }
  })
  return { root, in: inlet, value, entities: [root, inlet, value] } as const
}

const rawFlow = defineRelation('process.flow', { from: 'port', to: 'port' })
function connect<
  const M extends Medium,
  const From extends Port<'out', M>,
  const To extends Port<'in', NoInfer<M>>
>(from: From, to: To) {
  return rawFlow(from, to)
}

const controls = defineRelation('control.writes', { from: 'controller', to: 'command' })

const singleWriter = invariant('single-writer', ({ relations }) => {
  const writers = new Map<string, AnyRelation>()
  const problems = []

  for (const relation of relations.filter((item) => item.type === 'control.writes')) {
    const key = refKey(relation.to)
    const previous = writers.get(key)
    if (previous) {
      problems.push(
        issue(
          'single-writer',
          'multiple-writers',
          `${key} is controlled by more than one owner`,
          previous.from,
          relation.from,
          relation.to
        )
      )
    } else {
      writers.set(key, relation)
    }
  }

  return problems
})

const sourceTank = tank('tank-1')
const pump1 = pump('pump-1')
const pt1 = pressureSensor('pt-1')
const mainPlc = entity('controller', 'main-plc', { meta: { runtime: 'plc' } })

const plcRunning = entity('plc.input', '%IX0.0', { meta: { valueType: 'boolean' } })
const plcStart = entity('plc.output', '%QX0.0', { meta: { valueType: 'boolean' } })
const wsRunning = entity('runtime.signal', 'pump-1.running', { meta: { transport: 'websocket' } })
const svgPump = entity('view.node', 'main/pump-1', { meta: { renderer: 'svg' } })
const historyFlow = entity('history.series', 'pump-1.flow', { meta: { retentionDays: 365 } })

export const boosterStation = defineGraph({
  id: 'water.booster-station',
  entities: [
    ...sourceTank.entities,
    ...pump1.entities,
    ...pt1.entities,
    mainPlc,
    plcRunning,
    plcStart,
    wsRunning,
    svgPump,
    historyFlow
  ],
  relations: [
    connect(sourceTank.out, pump1.in),
    connect(pump1.out, pt1.in),
    controls(mainPlc, pump1.start)
  ],
  projections: [
    project('plc', pump1.running, plcRunning),
    project('plc', pump1.start, plcStart),
    project('runtime', pump1.running, wsRunning),
    project('view', pump1.root, svgPump),
    project('history', pump1.flow, historyFlow)
  ],
  invariants: [singleWriter]
})

console.log('booster graph fingerprint:', await fingerprint(boosterStation))
