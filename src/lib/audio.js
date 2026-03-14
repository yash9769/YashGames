// lib/audio.js
// Basic audio utility to play sound effects.

const sounds = {
  pop: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2443af12a2.mp3?filename=pop-39222.mp3',
  success: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3',
  error: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_33bc4e7fe4.mp3?filename=error-126627.mp3',
  win: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_51bb6cbf32.mp3?filename=kids-greeting-win-100262.mp3'
}

const audioElements = {}

export function preloadSounds() {
  if (typeof window === 'undefined') return
  Object.keys(sounds).forEach(key => {
    const audio = new Audio(sounds[key])
    audio.preload = 'auto'
    audioElements[key] = audio
  })
}

export function playSound(name) {
  if (typeof window === 'undefined') return
  try {
    const sound = audioElements[name] || new Audio(sounds[name])
    sound.currentTime = 0
    sound.volume = 0.5 // Keep it subtle
    sound.play().catch(e => console.warn('Audio playback prevented:', e))
  } catch (e) {
    // Ignore. Audio might be blocked by browser policy without user interaction.
  }
}
