import { canonicalStringify } from './canonical.js'
import { compileGraph } from './graph.js'
import type { GraphDefinition, GraphIR } from './types.js'

/** SHA-256 fingerprint of canonical IR. Stable across authoring order changes. */
export async function fingerprint(value: GraphDefinition | GraphIR): Promise<string> {
  const ir = isGraphIR(value) ? value : compileGraph(value)
  const bytes = new TextEncoder().encode(canonicalStringify(ir))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function isGraphIR(value: GraphDefinition | GraphIR): value is GraphIR {
  return 'schemaVersion' in value && value.schemaVersion === 1
}
