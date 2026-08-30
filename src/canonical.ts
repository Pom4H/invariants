import type { JsonValue } from './types.js'

/** Canonical JSON with recursively sorted object keys and strict JSON-compatible values. */
export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

export function canonicalize(value: unknown, path = '$'): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${path}: number must be finite`)
    return Object.is(value, -0) ? 0 : value
  }

  if (Array.isArray(value)) {
    return Object.freeze(value.map((item, index) => canonicalize(item, `${path}[${index}]`)))
  }

  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${path}: only plain objects are canonicalizable`)
    }

    const input = value as Record<string, unknown>
    const output: Record<string, JsonValue> = {}
    for (const key of Object.keys(input).sort()) {
      const item = input[key]
      if (item === undefined) throw new TypeError(`${path}.${key}: undefined is not canonicalizable`)
      output[key] = canonicalize(item, `${path}.${key}`)
    }
    return Object.freeze(output)
  }

  throw new TypeError(`${path}: ${typeof value} is not canonicalizable`)
}
