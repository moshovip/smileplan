import Script from 'next/script'

interface Props {
  postUrl: string
}

const TG_URL_RE = /^https:\/\/t\.me\/([A-Za-z0-9_]+)\/(\d+)$/

export function TelegramEmbed({ postUrl }: Props) {
  const match = postUrl.match(TG_URL_RE)
  if (!match) {
    return (
      <div className="my-6 rounded-2xl border border-border bg-bg-card p-5 text-sm text-text-sub">
        Couldn't parse the Telegram post link: <span className="font-mono">{postUrl}</span>
      </div>
    )
  }
  const dataPost = `${match[1]}/${match[2]}`
  return (
    <div data-mdx-block="telegram-embed" className="my-6 rounded-2xl border border-border bg-bg-card-hover overflow-hidden">
      <div className="px-5 py-2 border-b border-border bg-bg-card text-xs text-text-sub flex items-center gap-2">
        <span className="text-accent text-[10px] font-semibold uppercase tracking-[0.15em]">Telegram</span>
        <a href={postUrl} target="_blank" rel="noopener noreferrer" className="text-text-sub hover:text-accent">
          {postUrl}
        </a>
      </div>
      <div className="p-2">
        <Script
          id="telegram-widget"
          src="https://telegram.org/js/telegram-widget.js?22"
          strategy="lazyOnload"
        />
        <blockquote
          className="telegram-post"
          data-telegram-post={dataPost}
          data-width="100%"
          data-dark="1"
        />
      </div>
    </div>
  )
}
