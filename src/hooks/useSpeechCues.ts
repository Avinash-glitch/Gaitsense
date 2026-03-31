import { useCallback, useRef } from 'react'

export function useSpeechCues() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string, priority = false) => {
    if (!('speechSynthesis' in window)) return

    if (priority) {
      window.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Prefer a natural-sounding voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
      (v) =>
        v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Karen') ||
        v.name.includes('Daniel')
    )
    if (preferred) utterance.voice = preferred

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  return { speak, cancel }
}

export const SPEECH_CUES = {
  START: 'Starting gait analysis. Walk naturally away from the camera.',
  REAR: 'Good. Keep walking away from the camera.',
  RIGHT_SIDE: 'Great. Now turn and walk across in front of the camera, from left to right.',
  FRONT: 'Perfect. Now walk toward the camera.',
  LEFT_SIDE: 'Good. Now turn and walk back from right to left.',
  SECOND_LAP: 'Great work. One more lap at the same pace.',
  COMPLETE: 'Excellent! Analysis complete. Please stand still for your results.',
  TIMEOUT: 'Recording complete. Generating your gait report.',
  PASS_DONE: 'Pass complete.',
}
