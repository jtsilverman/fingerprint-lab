/**
 * Speech synthesis voice fingerprinting.
 * Available voices vary by OS and browser.
 */

import { sha256 } from '../hash.js';

export async function collectSpeech() {
  if (!window.speechSynthesis) {
    return {
      name: 'Speech Voices',
      category: 'hardware',
      value: 'not supported',
      displayValue: 'Speech synthesis not available',
      entropy: 0.5,
      description: 'Speech synthesis API is not available in this browser.',
    };
  }

  // Voices may load asynchronously
  let voices = speechSynthesis.getVoices();
  if (voices.length === 0) {
    await new Promise((resolve) => {
      speechSynthesis.onvoiceschanged = resolve;
      setTimeout(resolve, 2000);
    });
    voices = speechSynthesis.getVoices();
  }

  const voiceData = voices.map(v => `${v.name}|${v.lang}|${v.localService}`);
  const hash = await sha256(voiceData.join(','));

  return {
    name: 'Speech Voices',
    category: 'hardware',
    value: { count: voices.length, voices: voiceData.slice(0, 10) },
    displayValue: `${voices.length} voices available`,
    entropy: 5.8,
    description: 'The list of text-to-speech voices installed on your system. macOS, Windows, and Linux each have different default voices, and users can install additional ones.',
    mitigation: 'Tor Browser disables the SpeechSynthesis API entirely.',
  };
}
