# Lifecycle Invariants: Your Types Should Survive Deployment

Most software loses type information exactly where systems become expensive to debug: at lifecycle boundaries.

Inside application code we work hard to make invalid states unrepresentable. Then we cross into deployment, runtime configuration, telemetry, storage or visualization and replace semantic identities with strings.

A service called `api` becomes a Kubernetes resource named `api`, a DNS name called `api`, a URL assembled from `"api"`, and another `"api"` in application runtime code. The type system knew these values represented one entity. The lifecycle did not preserve that fact.

I first ran into this while building [tsops](https://github.com/Pom4H/tsops), a TypeScript-first infrastructure toolkit. A config declares applications, namespaces, secrets and ports. TypeScript can infer their literal identities and reject invalid references. More importantly, those identities do not have to disappear after deployment: the same configuration can expose runtime helpers whose valid app names still come from the design-time declaration.

That suggested a broader pattern.

## Design-time types are usually temporary

Consider a typed declaration:

```ts
const config = defineConfig({
  apps: {
    api: {},
    worker: {},
  },
})
```

At design time, `keyof apps` is `"api" | "worker"`.

A helper can therefore reject this:

```ts
config.url('payments', 'service')
//         ^^^^^^^^^^ compile error
```

But many systems throw this information away after generating deployment artifacts. Runtime code goes back to independently maintained strings.

The invariant existed. The architecture stopped carrying it.

## The same problem appears in industrial automation

While designing LanMon 5, I found the same failure mode in a completely different domain.

An industrial pump has one physical identity, but traditional automation software often represents it independently as:

```text
pump-1
  ↓
PLC address
  ↓
SCADA tag
  ↓
historian series
  ↓
SVG element
  ↓
simulation object
```

Each layer can be correct locally and the complete system can still be wrong.

A visualization may bind to the wrong tag. An alarm can point to a stale address. A simulator can model a different device revision. A historian series can survive after an engineering object was renamed.

The root problem is not SCADA. It is identity discontinuity.

## Lifecycle invariants

I use **lifecycle invariant** for a relationship declared during system design whose identity or constraint remains machine-verifiable as the system moves through later phases.

Examples:

- an application referenced at runtime must have been declared at design time;
- a secret key reference must exist in the declared secret;
- a water output cannot connect to an air input;
- a PLC output may have only one control owner;
- an SVG node displaying a pump must trace back to the same pump identity used by telemetry;
- a generated PLC artifact and runtime manifest must share the same semantic project fingerprint.

This is related to “make invalid states unrepresentable”, but the scope is larger. The state being protected is not only an in-memory value. It is a relationship across phases of a system lifecycle.

## Two different mechanisms are necessary

Not every invariant belongs in TypeScript's type system.

### Compile-time invariants

Some constraints are local enough to encode directly:

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
```

Now this is impossible to compile:

```ts
connect(waterOut, airIn)
```

The compiler is doing domain validation before a runtime representation even exists.

### Materialized graph invariants

Other constraints require knowledge of the whole system.

A “single writer” rule cannot necessarily be proven while one declaration is being authored. After the graph is materialized, however, a compiler pass can find every control relationship and reject multiple owners of one command.

This produces a useful split:

```text
TypeScript
  │
  ├── local structural invariants
  │
  ▼
semantic graph
  │
  ├── graph-wide invariants
  │
  ▼
canonical IR
```

Trying to force both categories into a single mechanism makes APIs worse. Type systems are excellent at some proofs. Deterministic compiler passes are better at others.

## Preserve identity, not implementation details

The source identity should remain semantic:

```ts
const running = entity('signal', 'pump-1.running')
```

Later phases are projections:

```ts
project('plc', running, plcInput('%IX0.0'))
project('runtime', running, wsSignal('pump-1.running'))
project('history', flow, series('pump-1.flow'))
```

The PLC address is not the pump identity. The WebSocket topic is not the pump identity. The database series name is not the pump identity.

They are materializations of it.

That distinction makes refactoring and verification much easier.

## Canonical IR closes the loop

The typed authoring representation should not become the deployed runtime model. Arbitrary TypeScript is useful for humans, IDEs and AI agents, but production runtimes need immutable data.

So the lifecycle becomes:

```text
TypeScript authoring
       ↓
typed semantic graph
       ↓
canonical IR
       ↓
PLC / deployment / runtime / UI / simulation
```

If canonical IR is deterministic, it can be fingerprinted.

Then every derived artifact can carry the same SHA-256 revision:

```text
PLC artifact       7e12... ✅
runtime manifest   7e12... ✅
SVG projection     7e12... ✅
simulation report  7e12... ✅
```

A mismatched fingerprint is no longer “probably stale configuration”. It is a mechanically detectable inconsistent deployment.

## Extracting the pattern

I extracted the minimum mechanism into [invariants](https://github.com/Pom4H/invariants).

The library deliberately knows nothing about Kubernetes or SCADA. Its core vocabulary is small:

```text
entity
relation
projection
invariant
graph
canonical IR
fingerprint
lineage
```

A domain adapter supplies the meaning.

Infrastructure can model applications, resources and runtime endpoints. Industrial automation can model equipment, ports, signals, commands and PLC bindings.

The useful test of an abstraction is whether it survives a domain change. `tsops` and LanMon are intentionally very different proving grounds.

## Why this matters more with AI-generated systems

AI agents can generate a large amount of syntactically correct configuration very quickly. That makes semantic feedback loops more valuable, not less.

A good agent interface is not a giant JSON schema in the prompt. It is a compact language where the compiler can tell the agent:

- this entity does not exist;
- this relation is physically incompatible;
- this command already has an owner;
- this runtime artifact does not belong to this project revision.

TypeScript supplies an unusually strong existing toolchain for that loop: parser, formatter, IDE, language server, refactoring and a type checker already understood by coding agents.

The domain library only needs to add semantics.

## The principle

Types should not merely validate the shape of a design document.

They should help preserve the identities and relationships that make the running system the same system that was designed.

That is the idea behind lifecycle invariants.
