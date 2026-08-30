import { defineRelation, entity, type Entity } from '../src/index.js'

type Medium = 'water' | 'air'
type Direction = 'in' | 'out'
type Port<D extends Direction, M extends Medium> = Entity<
  'port',
  string,
  { direction: D; medium: M }
>

const rawConnect = defineRelation('flow', { from: 'port', to: 'port' })
function connect<const M extends Medium>(from: Port<'out', M>, to: Port<'in', NoInfer<M>>) {
  return rawConnect(from, to)
}

const waterOut = entity('port', 'pump.out', { meta: { direction: 'out', medium: 'water' } })
const waterIn = entity('port', 'valve.in', { meta: { direction: 'in', medium: 'water' } })
const airIn = entity('port', 'fan.in', { meta: { direction: 'in', medium: 'air' } })

connect(waterOut, waterIn)

// Domain adapters can make incompatible physical connections unrepresentable.
// @ts-expect-error water cannot flow into an air port
connect(waterOut, airIn)

const controls = defineRelation('controls', { from: 'controller', to: 'command' })
const plc = entity('controller', 'main-plc')
const pump = entity('equipment', 'pump-1')
const start = entity('command', 'pump-1.start')

controls(plc, start)

// @ts-expect-error equipment is not a controller
controls(pump, start)
