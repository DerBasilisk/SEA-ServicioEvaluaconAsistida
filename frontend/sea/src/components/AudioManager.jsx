import { useEffect, useRef, useState } from "react";
import useAudioStore from "../store/audioStore";

export default function AudioManager() {
  const { musicEnabled, volume, trackIndex, tracks, nextTrack } = useAudioStore();
  const audioRef = useRef(null);
  const [unlocked, setUnlocked] = useState(false);

  const tryPlay = () => {
    audioRef.current?.play()
      .then(() => setUnlocked(true))
      .catch(() => {});
  };

  // Desbloquear en cualquier interacción del usuario
  useEffect(() => {
    const events = ["click", "keydown", "touchstart", "pointerdown"];
    const handler = () => {
      if (!unlocked && musicEnabled) tryPlay();
    };
    events.forEach(e => document.addEventListener(e, handler, { once: false }));
    return () => events.forEach(e => document.removeEventListener(e, handler));
  }, [unlocked, musicEnabled]);

  // Cambiar track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = tracks[trackIndex].src;
    audio.load();
    if (musicEnabled && unlocked) tryPlay();
  }, [trackIndex]);

  // Play / pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (musicEnabled && unlocked) tryPlay();
    else audioRef.current.pause();
  }, [musicEnabled, unlocked]);

  // Volumen
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  return (
    <audio
      ref={audioRef}
      src={tracks[trackIndex].src}
      volume={volume}
      onEnded={nextTrack}
      preload="auto"
    />
  );
}