# LanMon 5 adapter

`invariants` stays domain-agnostic. LanMon defines engineering semantics in its own adapter and lowers canonical `ProjectIR` into the generic lifecycle graph.

## Canonical identities

| LanMon concept | invariant entity kind | status |
| --- | --- | --- |
| equipment instance | `equipment` | integrated |
| physical port | `port` | integrated |
| measured state | `signal` | integrated |
| controllable action | `command` | integrated |
| controller | `controller` | integrated |
| PLC I/O address | `plc.input` / `plc.output` | integrated projection |
| WebSocket runtime state | `runtime.signal` | integrated projection |
| adaptive SVG node | `view.node` | integrated projection |
| historian series | `history.series` | next slice |
| simulation object | `simulation.entity` | next slice |

PLC addresses, SVG IDs and historian keys are projections. They must never replace the engineering identity as source of truth.

## Current compiler-pass invariants

LanMon project compilation now materializes and validates the lifecycle graph before deriving runtime/PLC/view artifacts.

Implemented graph checks:

- unique semantic identities;
- no dangling relation/projection references;
- process-flow media must match;
- process-flow port direction must be valid;
- one control owner per command unless the same controller is intentionally referenced by multiple rules;
- PLC/runtime/view artifacts retain explicit lineage back to canonical engineering identities.

The integration tests prove that `signal:pump-1.running` projects into both its PLC input and runtime WebSocket signal, while a second controller trying to own `command:pump-1.start` makes graph compilation fail.

## Compile-time invariants still to push into authoring

The current first slice starts from already-created `ProjectIR`, so some design-time guarantees remain in the LanMon eDSL rather than in `invariants` relations.

The next authoring refactor should preserve literal equipment identities and make these invalid states unrepresentable where practical:

- equipment model belongs to its equipment type;
- physical connection media are compatible at the `flow()` call site;
- port directions are compatible at the `flow()` call site;
- `read()` accepts signals, not commands;
- `write()` accepts commands, not signals;
- digital/analog I/O value types are compatible;
- physical quantities and units are compatible;
- fault type can target the selected equipment type.

One concrete gap is that current LanMon `use(id: string, ...)` erases the literal instance ID in its authoring handle. The next slice should preserve that ID generically so `pump-1`, its ports, signals and commands remain one typed identity before IR exists as well as after it is materialized.

## Next slices

1. Preserve literal identity in the TypeScript engineering eDSL.
2. Move process-medium/direction incompatibility from runtime-only validation to compile-time typing.
3. Add historian projections from canonical `Signal` identities.
4. Add scenario/fault/simulation identities and lineage.
5. Represent interlocks as first-class relations so PLC, UI and API enforcement share one safety definition.
6. Attach the canonical project fingerprint to every generated lifecycle artifact.

The rule remains: add a concept to `invariants` core only if the same primitive is useful outside LanMon. Engineering vocabulary belongs in LanMon.
