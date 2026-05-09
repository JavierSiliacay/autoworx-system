/**
 * Plays an audio file with a software volume boost using the Web Audio API.
 * This is useful for sound files that are naturally too quiet.
 * 
 * @param url The path to the audio file (e.g. '/appointment.mp3')
 * @param volumeBoost The multiplier for the volume (e.g. 2.0 for 200% volume)
 */
export async function playAmplifiedAudio(url: string, volumeBoost: number = 2.5) {
  try {
    // 1. Create AudioContext
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioContextClass) {
      throw new Error("Web Audio API not supported");
    }
    
    const audioContext = new AudioContextClass();
    
    // 2. Fetch and decode audio
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // 3. Create nodes
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volumeBoost;
    
    // 4. Connect nodes: Source -> Gain -> Destination (Speakers)
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 5. Play
    source.start();
    
    console.log(`[AudioUtils] Playing ${url} with ${volumeBoost}x boost.`);
  } catch (err) {
    console.warn(`[AudioUtils] Amplification failed for ${url}, falling back to standard playback:`, err);
    // Fallback to standard Audio element if Web Audio API fails
    const audio = new Audio(url);
    audio.play().catch(e => console.error("[AudioUtils] Fallback also failed:", e));
  }
}
