# LanMon 5 adapter sketch

`@pom4h/invariants` stays domain-agnostic. LanMon should define engineering semantics in its own adapter/package and lower them into the generic graph.

## Canonical identities

| LanMon concept | invariant entity kind |
| --- | --- |
| equipment instance | `equipment` |
| physical port | `port` |
| measured state | `signal` |
| controllable action | `command` |
| controller | `controller` |
| PLC I/O address | `plc.input` / `plc.output` |
| WebSocket runtime state | `runtime.signal` |
| historian series | `history.series` |
| adaptive SVG node | `view.node` |
| simulation object | `simulation.entity` |

PLC addresses, SVG IDs and historian keys are projections. They must never replace the engineering identity as source of truth.

## Compile-time invariants

The adapter should make these invalid states unrepresentable where practical:

- equipment model belongs to its equipment type;
- physical connection media are compatible;
- port directions are compatible;
- `read()` accepts signals, not commands;
- `write()` accepts commands, not signals;
- digital/analog I/O value types are compatible;
- physical quantities and units are compatible;
- fault type can target the selected equipment type.

## Graph invariants

Compiler-pass rules should include:

- unique semantic identities;
- no dangling references;
- one control owner per command unless arbitration is explicit;
- no duplicated PLC addresses with incompatible bindings;
- every operator-visible command is covered by its required interlocks;
- alarm predicates reference declared signals;
- all generated/runtime projections belong to the same project revision;
- every required runtime/historian/view projection is reachable from a canonical engineering identity.

## First migration slice

Start with the existing LanMon 5 booster station:

```text
Tank → Pump → Pressure sensor → Valve
```

Move only:

1. equipment identity;
2. ports + process flow;
3. signals/commands;
4. PLC I/O projections;
5. runtime/view/history projections;
6. single-writer invariant;
7. project fingerprint.

Do not move simulation, units or alarms until this slice proves that the generic graph makes the LanMon implementation smaller rather than more abstract.
