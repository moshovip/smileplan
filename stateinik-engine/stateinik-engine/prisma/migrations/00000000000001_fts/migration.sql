-- Full-text search for Guides.
--
-- The `contentTsv` tsvector column (created by the init migration) is kept up to
-- date by a BEFORE INSERT/UPDATE trigger and indexed with GIN. Title/excerpt/content
-- are weighted A/B/C so title hits rank highest.
--
-- LANGUAGE: this ships with the 'english' dictionary to match the default
-- FTS_LANGUAGE in .env / site.config.ts. To run a different language (e.g.
-- Russian), replace BOTH 'english' occurrences below with your dictionary
-- (e.g. 'russian') AND set FTS_LANGUAGE accordingly, then re-run the trigger
-- against existing rows with:  UPDATE "Guide" SET "updatedAt" = "updatedAt";

CREATE OR REPLACE FUNCTION guide_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW."contentTsv" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guide_tsv_update ON "Guide";
CREATE TRIGGER guide_tsv_update
  BEFORE INSERT OR UPDATE OF title, excerpt, content ON "Guide"
  FOR EACH ROW EXECUTE FUNCTION guide_tsv_trigger();

CREATE INDEX IF NOT EXISTS guide_content_tsv_idx ON "Guide" USING GIN ("contentTsv");
