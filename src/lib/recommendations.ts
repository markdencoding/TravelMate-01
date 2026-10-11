export interface WikidataBinding {
  place?: { value: string };
  placeLabel?: { value: string };
  coords?: { value: string };
  sitelinks?: { value: string };
}

export interface RecommendationItem {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  sitelinks: number;
}

/**
 * Parses raw Wikidata SPARQL bindings into clean RecommendationItem objects.
 * Handles deduplication, coordinate parsing (Point(lon lat)), and skips raw Q-codes.
 */
export function parseWikidataRecommendations(
  bindings: WikidataBinding[],
  country: string
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  const seenNames = new Set<string>();

  for (const b of bindings) {
    const name = b.placeLabel?.value?.trim();
    const coords = b.coords?.value?.trim() || '';
    const sitelinks = parseInt(b.sitelinks?.value || '0', 10);
    const uri = b.place?.value || '';
    const id = uri.split('/').pop() || name || Math.random().toString();

    // Skip missing, already seen, or unlabelled Q-numbers (e.g. "Q12345")
    if (!name || seenNames.has(name.toLowerCase()) || /^Q\d+$/.test(name)) {
      continue;
    }
    seenNames.add(name.toLowerCase());

    // Parse coordinates: Point(lon lat)
    const match = coords.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
    const lon = match ? parseFloat(match[1]) : 0;
    const lat = match ? parseFloat(match[2]) : 0;

    recommendations.push({
      id,
      name,
      country,
      latitude: lat,
      longitude: lon,
      sitelinks,
    });
  }

  return recommendations;
}
