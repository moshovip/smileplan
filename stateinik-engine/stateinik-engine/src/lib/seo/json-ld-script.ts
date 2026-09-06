/**
 * Serialize a JSON-LD graph for safe injection into a <script> tag.
 *
 * JSON.stringify does NOT escape `<`, `>` or `&`, so a value containing
 * `</script>` would break out of the script element (stored XSS). Encoding
 * these to their \u escapes keeps the JSON valid for schema.org parsers while
 * making `</script>` impossible to express.
 */
export function jsonLdScript(graph: unknown): string {
  return JSON.stringify(graph)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
