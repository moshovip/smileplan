/**
 * Converts user input into a string that is safe for PostgreSQL `to_tsquery(<lang>, ...)`.
 *
 * to_tsquery chokes on the special characters `&|!:*()`, so we strip them out.
 * Words are joined with the `&` (AND) operator. Prefix search via `:*` for the last word.
 *
 * Empty input → empty string, and the search page shows "enter a query".
 */

const FORBIDDEN_RE = /[&|!:*()<>'"`\\]/g

// Hard limit on input length so a DoS request like `?q=<1MB>` never reaches Postgres.
// 200 characters cover any reasonable human query.
const MAX_INPUT_LENGTH = 200
const MAX_TOKENS = 10
const MAX_TOKEN_LENGTH = 50

export function toTsQuery(input: string): string {
  const cleaned = input
    .slice(0, MAX_INPUT_LENGTH)
    .replace(FORBIDDEN_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return ''
  const tokens = cleaned
    .split(' ')
    .filter((t) => t.length > 0)
    .map((t) => t.slice(0, MAX_TOKEN_LENGTH))
    .slice(0, MAX_TOKENS)
  if (tokens.length === 0) return ''
  // Prefix search for the last token, so "webh" matches "webhook".
  const last = tokens.pop() as string
  const head = tokens.length > 0 ? tokens.join(' & ') + ' & ' : ''
  return `${head}${last}:*`
}
