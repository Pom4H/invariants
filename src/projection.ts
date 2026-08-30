import type { AnyRef, JsonObject, Projection } from './types.js'

const EMPTY = Object.freeze({}) as JsonObject

/**
 * Record that a semantic source identity materializes as a concrete target in a lifecycle phase.
 * The source stays canonical; the target is a derived artifact/runtime identity.
 */
export function project<
  const TPhase extends string,
  const TSource extends AnyRef,
  const TTarget extends AnyRef,
  const TData extends JsonObject = Record<never, never>
>(
  phase: TPhase,
  source: TSource,
  target: TTarget,
  data?: TData
): Projection<TPhase, TSource, TTarget, TData> {
  if (phase.trim().length === 0) throw new Error('projection phase must not be empty')
  return Object.freeze({
    phase,
    source,
    target,
    data: Object.freeze({ ...(data ?? EMPTY) }) as Readonly<TData>
  })
}
