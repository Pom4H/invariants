import type { AnyRef, Entity, JsonObject, Ref, RefIR } from './types.js'

const EMPTY = Object.freeze({}) as JsonObject

/** Declare a semantic entity with a stable identity and serializable metadata. */
export function entity<
  const TKind extends string,
  const TId extends string,
  const TMeta extends JsonObject = Record<never, never>,
  const TData extends JsonObject = Record<never, never>
>(
  kind: TKind,
  id: TId,
  options: Readonly<{ meta?: TMeta; data?: TData }> = {}
): Entity<TKind, TId, TMeta, TData> {
  assertIdentity(kind, id)
  const value = {
    kind,
    id,
    meta: Object.freeze({ ...(options.meta ?? EMPTY) }),
    data: Object.freeze({ ...(options.data ?? EMPTY) })
  }
  return Object.freeze(value) as Entity<TKind, TId, TMeta, TData>
}

/** Keep the semantic identity while intentionally dropping entity payload. */
export function refOf<const TRef extends AnyRef>(value: TRef): Ref<TRef['kind'], TRef['id'], TRef['meta']> {
  return value as Ref<TRef['kind'], TRef['id'], TRef['meta']>
}

export function toRefIR(value: AnyRef): RefIR {
  return Object.freeze({ kind: value.kind, id: value.id })
}

export function refKey(value: Pick<AnyRef, 'kind' | 'id'>): string {
  return `${value.kind}:${value.id}`
}

function assertIdentity(kind: string, id: string): void {
  if (kind.trim().length === 0) throw new Error('entity kind must not be empty')
  if (id.trim().length === 0) throw new Error(`entity ${kind}: id must not be empty`)
}
