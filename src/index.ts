export { canonicalStringify, canonicalize } from './canonical.js'
export { entity, refKey, refOf, toRefIR } from './entity.js'
export { fingerprint } from './fingerprint.js'
export { compileGraph, defineGraph, GraphValidationError, validateGraph } from './graph.js'
export { invariant, issue } from './invariant.js'
export { lineage, type LineageStep } from './lineage.js'
export { project } from './projection.js'
export { defineRelation } from './relation.js'
export type {
  AnyEntity,
  AnyProjection,
  AnyRef,
  AnyRelation,
  Entity,
  EntityIR,
  GraphDefinition,
  GraphIR,
  GraphSnapshot,
  Invariant,
  InvariantIssue,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  Projection,
  ProjectionIR,
  Ref,
  RefIR,
  Relation,
  RelationIR,
  ValidationReport
} from './types.js'
