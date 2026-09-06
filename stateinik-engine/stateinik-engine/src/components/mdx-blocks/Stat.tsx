interface Props {
  value: string
  label: string
  source?: string
  sourceUrl?: string
}

export function Stat({ value, label, source, sourceUrl }: Props) {
  return (
    <div data-mdx-block="stat" className="my-6 rounded-2xl border border-border bg-bg-card p-6 inline-block min-w-[200px]">
      <div className="font-head text-5xl leading-none text-accent mb-2">{value}</div>
      <div className="text-[15px] text-text mb-1">{label}</div>
      {source && (
        <div className="text-xs text-text-dim">
          Source:{' '}
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-text-sub hover:text-accent underline-offset-2 hover:underline">
              {source}
            </a>
          ) : (
            source
          )}
        </div>
      )}
    </div>
  )
}
