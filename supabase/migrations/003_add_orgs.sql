-- Orgs table
CREATE TABLE public.orgs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL CHECK (
                length(slug) BETWEEN 2 AND 39
                AND slug ~ '^[a-z0-9-]+$'
              ),
  display_name text NOT NULL,
  github_org  text,
  description text,
  unlisted    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orgs_slug ON public.orgs (slug);

-- Join table: buddy <-> org membership
CREATE TABLE public.buddy_orgs (
  buddy_id     uuid NOT NULL REFERENCES public.buddies(id) ON DELETE CASCADE,
  org_id       uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  org_verified boolean NOT NULL DEFAULT false,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (buddy_id, org_id)
);

CREATE INDEX idx_buddy_orgs_org_id ON public.buddy_orgs (org_id);
CREATE INDEX idx_buddy_orgs_buddy_id ON public.buddy_orgs (buddy_id);

-- RLS
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read orgs" ON public.orgs FOR SELECT USING (true);
CREATE POLICY "Anyone can read buddy_orgs" ON public.buddy_orgs FOR SELECT USING (true);
CREATE POLICY "No direct inserts on orgs" ON public.orgs FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct inserts on buddy_orgs" ON public.buddy_orgs FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct updates on orgs" ON public.orgs FOR UPDATE USING (false);
CREATE POLICY "No direct updates on buddy_orgs" ON public.buddy_orgs FOR UPDATE USING (false);

-- Public view with computed counts
CREATE VIEW public.orgs_public AS
  SELECT
    o.id, o.slug, o.display_name, o.github_org, o.description, o.unlisted, o.created_at,
    COUNT(bo.buddy_id)::int AS member_count,
    COUNT(bo.buddy_id) FILTER (WHERE bo.org_verified)::int AS verified_member_count
  FROM public.orgs o
  LEFT JOIN public.buddy_orgs bo ON bo.org_id = o.id
  GROUP BY o.id;

GRANT SELECT ON public.orgs_public TO anon;
GRANT SELECT ON public.buddy_orgs TO anon;

-- View for org members with buddy data
CREATE VIEW public.org_members AS
  SELECT
    bo.org_id, bo.org_verified, bo.joined_at,
    b.id AS buddy_id, b.username, b.name, b.species, b.rarity, b.shiny,
    b.stats, b.total_stats, b.github_username, b.github_verified,
    b.github_avatar_url, b.eye, b.hat, b.personality, b.hatched_at,
    b.created_at, b.updated_at
  FROM public.buddy_orgs bo
  JOIN public.buddies b ON b.id = bo.buddy_id;

GRANT SELECT ON public.org_members TO anon;

-- RPC to claim org membership
CREATE OR REPLACE FUNCTION public.claim_org(
  p_username    text,
  p_token       text,
  p_org_slug    text,
  p_org_verified boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buddy   record;
  v_org     record;
BEGIN
  SELECT * INTO v_buddy FROM public.buddies WHERE username = p_username;
  IF v_buddy IS NULL THEN
    RAISE EXCEPTION 'buddy_not_found: No buddy with username %', p_username;
  END IF;
  IF p_token IS NULL OR v_buddy.secret_token != crypt(p_token, v_buddy.secret_token) THEN
    RAISE EXCEPTION 'invalid_token: Token does not match';
  END IF;

  -- Auto-create org if it doesn't exist
  INSERT INTO public.orgs (slug, display_name, github_org)
  VALUES (p_org_slug, p_org_slug, p_org_slug)
  ON CONFLICT (slug) DO NOTHING;

  SELECT * INTO v_org FROM public.orgs WHERE slug = p_org_slug;

  -- Upsert membership
  INSERT INTO public.buddy_orgs (buddy_id, org_id, org_verified, joined_at)
  VALUES (v_buddy.id, v_org.id, p_org_verified, now())
  ON CONFLICT (buddy_id, org_id)
  DO UPDATE SET org_verified = EXCLUDED.org_verified, joined_at = now();

  RETURN jsonb_build_object('org_slug', p_org_slug, 'org_verified', p_org_verified);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_org TO anon;
