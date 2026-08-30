# AGENTS.md

## Mission

`invariants` is a tiny, domain-agnostic TypeScript foundation for preserving semantic identities and relationships across lifecycle phases.

## Non-negotiable boundaries

- Keep the core independent of LanMon, SCADA, Kubernetes, Docker, databases and UI frameworks.
- Keep zero runtime dependencies unless there is an exceptional, measured reason.
- Prefer TypeScript compile-time guarantees for local structural constraints.
- Prefer deterministic graph validation for constraints that require the materialized system.
- Never use generated/deployment identifiers as the canonical semantic identity.
- Every runtime-relevant structure must lower to plain serializable IR.
- Canonical IR must remain deterministic across declaration ordering.
- Fingerprints must be derived from canonical IR only.
- Projections preserve lineage; they do not replace source identity.

## API scope for 0.x

Core vocabulary should remain close to:

- `entity`
- `defineRelation`
- `project`
- `invariant`
- `defineGraph`
- `validateGraph`
- `compileGraph`
- `lineage`
- `fingerprint`

Domain-specific convenience APIs belong in adapters or examples.

## Testing

Every change should preserve:

1. `bun run typecheck`
2. `bun test`
3. `bun run build`

Use `@ts-expect-error` tests for relationships that must remain unrepresentable at compile time. Runtime tests should cover graph-global invariants, deterministic compilation and lineage.

## Design rule

If a proposed feature can be implemented entirely in a domain adapter without weakening the core, keep it out of core.
