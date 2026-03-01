-- ================================================================
-- supabase_setup.sql
-- Run this ONCE in Supabase SQL Editor.
-- Differences from basic version:
--   1. Table stores CHUNKS (not whole snippets)
--   2. Extra metadata columns (source, section, chunk_index)
--   3. hybrid_search() supports metadata filtering
-- ================================================================


-- STEP 1: Enable pgvector
create extension if not exists vector;


-- STEP 2: Main chunks table
-- Each row = one CHUNK of a document + its embedding
-- A single document produces multiple rows (one per chunk)
create table if not exists chunks (
  id            bigserial primary key,

  -- The actual text of this chunk
  content       text        not null,

  -- Which document this chunk came from
  source        text        not null,   -- e.g. "python-strings.md"

  -- Section heading this chunk falls under
  section       text        default '', -- e.g. "String Reversal"

  -- Position of this chunk within its document (0, 1, 2...)
  -- Useful for reconstructing context around a retrieved chunk
  chunk_index   int         not null,

  -- Metadata for filtering
  language      text        not null,   -- "python" | "javascript"
  tags          text[]      default '{}',

  -- 1536-dim vector from openai/text-embedding-3-small
  embedding     vector(1536),

  created_at    timestamptz default now()
);


-- STEP 3: Vector index for semantic search
create index if not exists chunks_embedding_idx
  on chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);


-- STEP 4: Full-text search column for keyword search
alter table chunks
  add column if not exists fts tsvector
  generated always as (
    to_tsvector('english',
      content  || ' ' ||
      source   || ' ' ||
      section  || ' ' ||
      language || ' ' ||
      array_to_string(tags, ' ')
    )
  ) stored;

create index if not exists chunks_fts_idx
  on chunks using gin(fts);


-- STEP 5: Hybrid search function with metadata filtering
-- New params vs basic version:
--   filter_language → only search chunks of this language (optional)
--   filter_tags     → only search chunks containing ALL these tags (optional)
create or replace function hybrid_search(
  query_text       text,
  query_embedding  vector(1536),
  match_count      int     default 5,
  filter_language  text    default null,   -- null = no filter
  filter_tags      text[]  default null    -- null = no filter
)
returns table (
  id           bigint,
  content      text,
  source       text,
  section      text,
  chunk_index  int,
  language     text,
  tags         text[],
  rrf_score    float
)
language sql
as $$
  with

  -- ── Semantic leg ──────────────────────────────────────────
  -- Finds chunks whose MEANING is closest to query
  -- Metadata filter applied here via WHERE clause
  semantic as (
    select
      id,
      row_number() over (order by embedding <=> query_embedding) as rank
    from chunks
    where
      -- Apply language filter only if provided
      (filter_language is null or language = filter_language)
      and
      -- Apply tags filter only if provided
      -- @> means "array contains all elements"
      (filter_tags is null or tags @> filter_tags)
    order by embedding <=> query_embedding
    limit 20
  ),

  -- ── Keyword leg ───────────────────────────────────────────
  -- Finds chunks containing the actual query words
  keyword as (
    select
      id,
      row_number() over (order by ts_rank(fts, query) desc) as rank
    from
      chunks,
      plainto_tsquery('english', query_text) query
    where
      fts @@ query
      and (filter_language is null or language = filter_language)
      and (filter_tags is null or tags @> filter_tags)
    order by ts_rank(fts, query) desc
    limit 20
  ),

  -- ── RRF merge ─────────────────────────────────────────────
  -- Combines both ranked lists into one score
  rrf as (
    select
      coalesce(s.id, k.id) as id,
      coalesce(1.0 / (s.rank + 60), 0) +
      coalesce(1.0 / (k.rank + 60), 0) as rrf_score
    from semantic s
    full outer join keyword k on s.id = k.id
  )

  select
    c.id,
    c.content,
    c.source,
    c.section,
    c.chunk_index,
    c.language,
    c.tags,
    rrf.rrf_score
  from rrf
  join chunks c on c.id = rrf.id
  order by rrf.rrf_score desc
  limit match_count;
$$;