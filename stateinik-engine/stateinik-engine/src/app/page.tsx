import Link from "next/link";
import { siteConfig, routes } from "@/site.config";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-narrow px-6 py-24">
      <p className="text-accent text-sm font-medium uppercase tracking-wider">
        {siteConfig.name}
      </p>
      <h1 className="font-head mt-3 text-4xl font-semibold leading-tight text-text">
        {siteConfig.tagline}
      </h1>
      <p className="mt-4 text-lg text-text-sub">{siteConfig.description}</p>
      <div className="mt-8 flex gap-4">
        <Link
          href={routes.guides()}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-bg transition hover:bg-accent-hover"
        >
          Browse guides
        </Link>
        {siteConfig.hasConcepts && (
          <Link
            href={routes.concepts()}
            className="rounded-lg border border-border px-5 py-2.5 font-medium text-text transition hover:border-border-hover"
          >
            Glossary
          </Link>
        )}
      </div>
    </main>
  );
}
