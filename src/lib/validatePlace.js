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
    if (data && data.length > 0) {
      const bestMatch = data[0]
      const importance = parseFloat(bestMatch.importance || 0)
      
      // We also check for 'type' to ensure it's a geographical feature
      const validTypes = ['city', 'town', 'village', 'country', 'state', 'administrative', 'island', 'continent', 'region', 'municipality', 'boundary', 'locality', 'suburb']
      const type = (bestMatch.type || '').toLowerCase()
      const addressType = (bestMatch.addresstype || '').toLowerCase()
      
      // Nominatim importance threshold: direct matches are usually > 0.4
      // Gibberish usually has 0 results or very low importance
      if (importance > 0.3 && (validTypes.includes(type) || validTypes.includes(addressType))) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Network error during validation:', error)
    return false
  }
}
