import { toRefIR } from './entity.js'
import type { AnyRef, GraphSnapshot, Invariant, InvariantIssue } from './types.js'

/** Define a runtime/materialization invariant over the fully declared semantic graph. */
export function invariant(
  name: string,
  check: (snapshot: GraphSnapshot) => void | InvariantIssue | readonly InvariantIssue[]
): Invariant {
  if (name.trim().length === 0) throw new Error('invariant name must not be empty')
  return Object.freeze({ name, check })
}

/** Small helper for producing consistent invariant diagnostics. */
export function issue(
  invariantName: string,
  code: string,
  message: string,
  ...refs: readonly AnyRef[]
): InvariantIssue {
  return Object.freeze({
    invariant: invariantName,
    code,
    message,
    refs: Object.freeze(refs.map(toRefIR))
  })
}
