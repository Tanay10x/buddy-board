ALTER TABLE public.buddies
  ADD COLUMN IF NOT EXISTS github_avatar_url text,
  ADD COLUMN IF NOT EXISTS github_bio text,
  ADD COLUMN IF NOT EXISTS github_profile_url text;

-- Update the public view to include new fields
DROP VIEW IF EXISTS public.buddies_public;
CREATE VIEW public.buddies_public AS
  SELECT
    id, username, github_username, github_verified,
    github_avatar_url, github_bio, github_profile_url,
    name, personality, hatched_at, species, rarity, eye, hat, shiny,
    stats, total_stats, created_at, updated_at
  FROM public.buddies;

GRANT SELECT ON public.buddies_public TO anon;

-- Update RPC to accept new params
CREATE OR REPLACE FUNCTION public.submit_buddy(
  p_username text,
  p_name text,
  p_personality text,
  p_hatched_at bigint,
  p_species text,
  p_rarity text,
  p_eye text,
  p_hat text,
  p_stats jsonb,
  p_token text default null,
  p_github_username text default null,
  p_github_verified boolean default false,
  p_shiny boolean default false,
  p_github_avatar_url text default null,
  p_github_bio text default null,
  p_github_profile_url text default null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  raw_token text;
  hashed_token text;
  existing record;
BEGIN
  SELECT * INTO existing FROM public.buddies WHERE username = p_username;

  IF existing IS NULL THEN
    raw_token := encode(gen_random_bytes(32), 'hex');
    hashed_token := crypt(raw_token, gen_salt('bf'));

    INSERT INTO public.buddies (
      username, secret_token, github_username, github_verified,
      github_avatar_url, github_bio, github_profile_url,
      name, personality, hatched_at, species, rarity, eye, hat, shiny, stats
    ) VALUES (
      p_username, hashed_token, p_github_username, p_github_verified,
      p_github_avatar_url, p_github_bio, p_github_profile_url,
      p_name, p_personality, p_hatched_at, p_species, p_rarity,
      p_eye, p_hat, p_shiny, p_stats
    );

    RETURN jsonb_build_object('token', raw_token, 'created', true);
  ELSE
    IF p_token IS NULL OR existing.secret_token != crypt(p_token, existing.secret_token) THEN
      RAISE EXCEPTION 'invalid_token: Token does not match';
    END IF;

    UPDATE public.buddies SET
      github_username = p_github_username,
      github_verified = p_github_verified,
      github_avatar_url = p_github_avatar_url,
      github_bio = p_github_bio,
      github_profile_url = p_github_profile_url,
      name = p_name,
      personality = p_personality,
      hatched_at = p_hatched_at,
      species = p_species,
      rarity = p_rarity,
      eye = p_eye,
      hat = p_hat,
      shiny = p_shiny,
      stats = p_stats,
      updated_at = now()
    WHERE username = p_username;

    RETURN jsonb_build_object('updated', true);
  END IF;
END;
$$;
