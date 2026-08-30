import type { AnyRef, JsonObject, Ref, Relation } from './types.js'

const EMPTY = Object.freeze({}) as JsonObject

/**
 * Define a reusable typed relation between two entity kinds.
 * Domain adapters can add stricter generic constraints around the returned function.
 */
export function defineRelation<
  const TType extends string,
  const TFromKind extends string,
  const TToKind extends string
>(
  type: TType,
  kinds: Readonly<{ from: TFromKind; to: TToKind }>
) {
  if (type.trim().length === 0) throw new Error('relation type must not be empty')

  return function relate<
    const TFrom extends Ref<TFromKind, string, JsonObject>,
    const TTo extends Ref<TToKind, string, JsonObject>,
    const TData extends JsonObject = Record<never, never>
  >(
    from: TFrom,
    to: TTo,
    data?: TData
  ): Relation<TType, TFrom, TTo, TData> {
    assertKind('from', from, kinds.from, type)
    assertKind('to', to, kinds.to, type)
    return Object.freeze({
      type,
      from,
      to,
      data: Object.freeze({ ...(data ?? EMPTY) }) as Readonly<TData>
    })
  }
}

function assertKind(role: string, ref: AnyRef, expected: string, relation: string): void {
  if (ref.kind !== expected) {
    throw new Error(`${relation}: ${role} must be ${expected}, got ${ref.kind}`)
  }
}
