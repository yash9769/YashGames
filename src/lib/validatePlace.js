export async function validatePlace(placeName) {
  if (!placeName || placeName.trim().length === 0) return false

  // Nominatim OpenStreetMap Search API
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName.trim())}&format=json&limit=1`
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AtlasGame/1.0 (multiplayer-atlas-game)'
      }
    })
    
    if (!res.ok) {
      console.warn('Nominatim API failure:', res.status)
      return false // Be strict
    }

    const data = await res.json()
    
    // Check if we have results and if they are "important" enough
    // Gibberish usually has 0 results or very low importance (< 0.2)
    if (data && data.length > 0) {
      const bestMatch = data[0]
      const importance = parseFloat(bestMatch.importance || 0)
      
      // We also check for 'type' to ensure it's a geographical feature
      const validTypes = ['city', 'town', 'village', 'country', 'state', 'administrative', 'island', 'continent', 'region', 'municipality', 'boundary']
      const isPlace = validTypes.some(t => bestMatch.type?.toLowerCase().includes(t) || bestMatch.addresstype?.toLowerCase().includes(t))

      if (importance > 0.1 && (isPlace || bestMatch.osm_type !== 'node')) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Network error during validation:', error)
    return false
  }
}
