# invariants

**Keep system identities and relationships typed from design to runtime.**

Most type safety dies at a lifecycle boundary.

You declare an entity as a typed value, then deployment turns it into a string, runtime recreates the same name as another string, telemetry uses a third identifier, and UI code binds a fourth. The compiler knew those values represented the same thing — then the architecture threw that information away.

`invariants` is a small TypeScript foundation for preserving those semantic identities across phases.

**Read the design note:** [Lifecycle Invariants: Your Types Should Survive Deployment](docs/lifecycle-invariants.md)

```text
TypeScript authoring
       │
       ▼
typed semantic graph
       │
       ├── compile-time constraints
       ├── graph-wide invariants
       └── deterministic IR + SHA-256 fingerprint
                 │
        ┌────────┼─────────┐
        ▼        ▼         ▼
     deploy    runtime     UI
        │        │         │
        └────────┴─────────┘
             lineage
```

## The idea

Declare a stable identity once:

```ts
const running = entity('signal', 'pump-1.running', {
  meta: { valueType: 'boolean' }
})
```

Then project that identity into concrete lifecycle artifacts:

```ts
const controllerInput = entity('controller.input', 'input-0')
const runtimeSignal = entity('runtime.signal', 'pump-1.running')

project('control', running, controllerInput)
project('runtime', running, runtimeSignal)
```

The source identity remains canonical. Controller addresses, runtime topics, database series, UI nodes and deployment resources are derived identities with explicit lineage.

## Two kinds of guarantees

### 1. Compile-time invariants

Domain adapters build stronger generic constraints on top of the tiny core.

```ts
type Port<D, M> = Entity<'port', string, {
  direction: D
  medium: M
}>

function connect<const M extends Medium>(
  from: Port<'out', M>,
  to: Port<'in', NoInfer<M>>,
) {
  return flow(from, to)
}

connect(waterOut, waterIn) // ✅
connect(waterOut, airIn)   // ❌ TypeScript error
```

Invalid domain relationships can become unrepresentable before IR exists.

### 2. Graph invariants

Some rules require the complete materialized system and belong in a compiler pass instead of the type system.

```ts
const singleWriter = invariant('single-writer', ({ relations }) => {
  // report when multiple controllers own the same command
})
```

`validateGraph()` also rejects duplicate semantic identities and dangling relation/projection references.

## Core API

```ts
import {
  entity,
  defineRelation,
  project,
  invariant,
  defineGraph,
  validateGraph,
  compileGraph,
  lineage,
  fingerprint,
} from '@pom4h/invariants'
```

The v0.1 core intentionally contains only:

- stable typed entity references;
- typed relations;
- lifecycle projections and lineage;
- graph-wide invariants;
- canonical serializable IR;
- deterministic SHA-256 fingerprints.

It intentionally does **not** contain schema validation, state machines, databases, networking, units, UI, Kubernetes or industrial-control concepts. Those belong in domain adapters.

## Industrial automation example

`examples/industrial.ts` models a tiny process:

```text
Tank ──water──▶ Pump ──water──▶ Pressure sensor
                 │
                 ├── running ──▶ controller input
                 ├── running ──▶ runtime signal
                 ├── flow ─────▶ historian series
                 ├── start ────▶ controller output
                 └── equipment ─▶ UI node
```

The same `pump-1` semantic identity survives control generation, runtime state, history and visualization instead of being independently recreated as strings.

## Why a separate library?

The pattern is not specific to industrial automation.

The same problem appears in infrastructure tooling:

```text
apps.api
   ├── deployment resource
   ├── service DNS
   ├── secret references
   └── runtime URL
```

and in engineering software:

```text
pump-1
   ├── controller bindings
   ├── telemetry
   ├── alarms
   ├── history
   ├── visualization
   └── simulation
```

The domain changes. The lifecycle invariant does not.

## Development

```bash
bun install
bun run check
bun run build
```

Type-level tests use `@ts-expect-error` to prove invalid relationships remain compile errors. Runtime tests cover deterministic compilation, fingerprints, dangling references, lineage and graph-wide invariants.

CI also installs the current commit into a clean external Bun project and imports the package there. This protects the Git-consumer contract independently from the repository's own tests.

## Status

`0.1` is deliberately small. The next proof is to apply the same core to independent domains without adding domain-specific concepts to the package itself.

## License

MIT
