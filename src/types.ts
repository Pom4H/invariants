export type JsonPrimitive = null | boolean | number | string
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[]
export type JsonObject = { readonly [key: string]: JsonValue }

const refBrand: unique symbol = Symbol('invariants.ref')

/** A stable semantic identity that can survive design, build, deploy and runtime phases. */
export type Ref<
  TKind extends string = string,
  TId extends string = string,
  TMeta extends JsonObject = JsonObject
> = Readonly<{
  kind: TKind
  id: TId
  meta: Readonly<TMeta>
  readonly [refBrand]: true
}>

/** A declared node in the semantic graph. Every entity is also a typed reference. */
export type Entity<
  TKind extends string = string,
  TId extends string = string,
  TMeta extends JsonObject = JsonObject,
  TData extends JsonObject = JsonObject
> = Ref<TKind, TId, TMeta> &
  Readonly<{
    data: Readonly<TData>
  }>

export type AnyRef = Ref<string, string, JsonObject>
export type AnyEntity = Entity<string, string, JsonObject, JsonObject>

export type RefIR = Readonly<{
  kind: string
  id: string
}>

export type EntityIR = Readonly<{
  kind: string
  id: string
  meta: JsonObject
  data: JsonObject
}>

export type Relation<
  TType extends string = string,
  TFrom extends AnyRef = AnyRef,
  TTo extends AnyRef = AnyRef,
  TData extends JsonObject = JsonObject
> = Readonly<{
  type: TType
  from: TFrom
  to: TTo
  data: Readonly<TData>
}>

export type AnyRelation = Relation<string, AnyRef, AnyRef, JsonObject>

export type RelationIR = Readonly<{
  type: string
  from: RefIR
  to: RefIR
  data: JsonObject
}>

/** A target produced from a source identity for a concrete lifecycle phase. */
export type Projection<
  TPhase extends string = string,
  TSource extends AnyRef = AnyRef,
  TTarget extends AnyRef = AnyRef,
  TData extends JsonObject = JsonObject
> = Readonly<{
  phase: TPhase
  source: TSource
  target: TTarget
  data: Readonly<TData>
}>

export type AnyProjection = Projection<string, AnyRef, AnyRef, JsonObject>

export type ProjectionIR = Readonly<{
  phase: string
  source: RefIR
  target: RefIR
  data: JsonObject
}>

export type InvariantIssue = Readonly<{
  invariant: string
  code: string
  message: string
  refs: readonly RefIR[]
}>

export type GraphSnapshot = Readonly<{
  id: string
  entities: readonly AnyEntity[]
  relations: readonly AnyRelation[]
  projections: readonly AnyProjection[]
}>

export type Invariant = Readonly<{
  name: string
  check(snapshot: GraphSnapshot): void | InvariantIssue | readonly InvariantIssue[]
}>

export type GraphDefinition = Readonly<{
  id: string
  entities: readonly AnyEntity[]
  relations?: readonly AnyRelation[]
  projections?: readonly AnyProjection[]
  invariants?: readonly Invariant[]
}>

export type GraphIR = Readonly<{
  schemaVersion: 1
  id: string
  entities: readonly EntityIR[]
  relations: readonly RelationIR[]
  projections: readonly ProjectionIR[]
}>

export type ValidationReport = Readonly<{
  ok: boolean
  issues: readonly InvariantIssue[]
}>
