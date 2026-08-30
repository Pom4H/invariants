import { canonicalStringify, canonicalize } from './canonical.js'
import { refKey, toRefIR } from './entity.js'
import type {
  AnyEntity,
  AnyProjection,
  AnyRelation,
  EntityIR,
  GraphDefinition,
  GraphIR,
  GraphSnapshot,
  InvariantIssue,
  JsonObject,
  ProjectionIR,
  RelationIR,
  ValidationReport
} from './types.js'

const GRAPH_INVARIANT = '$graph'

export class GraphValidationError extends Error {
  readonly issues: readonly InvariantIssue[]

  constructor(issues: readonly InvariantIssue[]) {
    super(`graph validation failed with ${issues.length} issue${issues.length === 1 ? '' : 's'}`)
    this.name = 'GraphValidationError'
    this.issues = issues
  }
}

/** Freeze the graph boundary while preserving literal types for domain adapters. */
export function defineGraph<const TGraph extends GraphDefinition>(definition: TGraph): TGraph {
  if (definition.id.trim().length === 0) throw new Error('graph id must not be empty')
  return Object.freeze({
    ...definition,
    entities: Object.freeze([...definition.entities]),
    relations: Object.freeze([...(definition.relations ?? [])]),
    projections: Object.freeze([...(definition.projections ?? [])]),
    invariants: Object.freeze([...(definition.invariants ?? [])])
  }) as TGraph
}

/** Validate graph-global constraints that cannot, or should not, live in TypeScript's type system. */
export function validateGraph(graph: GraphDefinition): ValidationReport {
  const snapshot = snapshotOf(graph)
  const issues: InvariantIssue[] = []
  const identities = new Set<string>()

  for (const entity of snapshot.entities) {
    const key = refKey(entity)
    if (identities.has(key)) {
      issues.push(graphIssue('duplicate-identity', `duplicate entity identity ${key}`, entity))
    } else {
      identities.add(key)
    }
  }

  for (const relation of snapshot.relations) {
    checkRegistered(identities, relation.from, `relation ${relation.type} has an undeclared source`, issues)
    checkRegistered(identities, relation.to, `relation ${relation.type} has an undeclared target`, issues)
  }

  for (const projection of snapshot.projections) {
    checkRegistered(identities, projection.source, `projection ${projection.phase} has an undeclared source`, issues)
    checkRegistered(identities, projection.target, `projection ${projection.phase} has an undeclared target`, issues)
  }

  for (const rule of graph.invariants ?? []) {
    const result = rule.check(snapshot)
    if (!result) continue
    if (Array.isArray(result)) issues.push(...result)
    else issues.push(result as InvariantIssue)
  }

  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) })
}

/** Lower the typed authoring graph into deterministic, serializable, runtime-safe IR. */
export function compileGraph(graph: GraphDefinition): GraphIR {
  const report = validateGraph(graph)
  if (!report.ok) throw new GraphValidationError(report.issues)

  const entities = graph.entities.map(lowerEntity).sort(compareCanonical)
  const relations = (graph.relations ?? []).map(lowerRelation).sort(compareCanonical)
  const projections = (graph.projections ?? []).map(lowerProjection).sort(compareCanonical)

  return Object.freeze({
    schemaVersion: 1 as const,
    id: graph.id,
    entities: Object.freeze(entities),
    relations: Object.freeze(relations),
    projections: Object.freeze(projections)
  })
}

function snapshotOf(graph: GraphDefinition): GraphSnapshot {
  return Object.freeze({
    id: graph.id,
    entities: Object.freeze([...graph.entities]),
    relations: Object.freeze([...(graph.relations ?? [])]),
    projections: Object.freeze([...(graph.projections ?? [])])
  })
}

function checkRegistered(
  identities: ReadonlySet<string>,
  ref: AnyEntity | AnyRelation['from'] | AnyProjection['source'],
  message: string,
  issues: InvariantIssue[]
): void {
  if (!identities.has(refKey(ref))) issues.push(graphIssue('dangling-reference', message, ref))
}

function graphIssue(code: string, message: string, ref: AnyRelation['from']): InvariantIssue {
  return Object.freeze({
    invariant: GRAPH_INVARIANT,
    code,
    message,
    refs: Object.freeze([toRefIR(ref)])
  })
}

function lowerEntity(entity: AnyEntity): EntityIR {
  return Object.freeze({
    kind: entity.kind,
    id: entity.id,
    meta: canonicalize(entity.meta) as JsonObject,
    data: canonicalize(entity.data) as JsonObject
  })
}

function lowerRelation(relation: AnyRelation): RelationIR {
  return Object.freeze({
    type: relation.type,
    from: toRefIR(relation.from),
    to: toRefIR(relation.to),
    data: canonicalize(relation.data) as JsonObject
  })
}

function lowerProjection(projection: AnyProjection): ProjectionIR {
  return Object.freeze({
    phase: projection.phase,
    source: toRefIR(projection.source),
    target: toRefIR(projection.target),
    data: canonicalize(projection.data) as JsonObject
  })
}

function compareCanonical(a: unknown, b: unknown): number {
  return canonicalStringify(a).localeCompare(canonicalStringify(b))
}
