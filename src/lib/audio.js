// lib/audio.js
// Basic audio utility to play sound effects.

const sounds = {
  pop: '',
  success: '',
  error: '',
  win: ''
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
