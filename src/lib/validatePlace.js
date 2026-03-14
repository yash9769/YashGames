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
      // If API fails (rate limit, offline), we give the user the benefit of the doubt
      console.warn('Nominatim API failure, defaulting to valid:', res.status)
      return true
    }

    const data = await res.json()
    
    // Any returned result indicates it's a known geographical feature matching the query
    if (data && data.length > 0) {
      return true
    }

    return false
  } catch (error) {
    console.error('Network error during validation, defaulting to valid:', error)
    return true
  }
}
