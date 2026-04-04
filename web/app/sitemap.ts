import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://buddyboard.xyz";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/stats`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/dex`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/org`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/recent`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.6 },
  ];

  // Dynamic user pages
  const { data: buddies } = await supabase
    .from("buddies")
    .select("username, updated_at")
    .order("total_stats", { ascending: false })
    .limit(500);

  const userPages: MetadataRoute.Sitemap = (buddies ?? []).map((buddy) => ({
    url: `${baseUrl}/u/${buddy.username}`,
    lastModified: new Date(buddy.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Species dex pages
  const species = [
    "duck", "goose", "blob", "cat", "dragon", "octopus", "owl", "penguin",
    "turtle", "snail", "ghost", "axolotl", "capybara", "cactus", "robot",
    "rabbit", "mushroom", "chonk",
  ];
  const speciesPages: MetadataRoute.Sitemap = species.map((s) => ({
    url: `${baseUrl}/dex/${s}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Rarity pages
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
  const rarityPages: MetadataRoute.Sitemap = rarities.map((r) => ({
    url: `${baseUrl}/rarity/${r}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Org pages
  const { data: orgs } = await supabase
    .from("orgs")
    .select("slug")
    .eq("unlisted", false);

  const orgPages: MetadataRoute.Sitemap = (orgs ?? []).map((org) => ({
    url: `${baseUrl}/org/${org.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...userPages, ...speciesPages, ...rarityPages, ...orgPages];
}
