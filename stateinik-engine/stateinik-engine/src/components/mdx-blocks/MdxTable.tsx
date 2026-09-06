import type { ReactNode, HTMLAttributes } from 'react'

// Override the standard <table> in MDX: wrap it in a horizontally scrollable
// container so wide tables (3+ columns, long inline-code paths) don't
// stretch the page beyond the viewport on mobile devices.
// On mobile, the container expands edge-to-edge via -mx-4 so the table
// isn't squeezed inside the article's 16px padding.

export function MdxTable(props: HTMLAttributes<HTMLTableElement> & { children?: ReactNode }) {
  const { children, ...rest } = props
  return (
    <div
      data-mdx-block="table-wrap"
      className="my-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto"
    >
      <table {...rest}>{children}</table>
    </div>
  )
}
