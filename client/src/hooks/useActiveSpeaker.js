import { useState, useEffect, useRef } from 'react';

/**
 * useActiveSpeaker Hook
 * 
 * Performs real-time audio analysis on local and remote WebRTC audio streams
 * to determine who is currently speaking.
 * Uses volume thresholds and debounce/hysteresis (hold time) to ensure smooth transitions
 * without rapid switching between participants.
 */
export function useActiveSpeaker({ localStream, remoteStreams, isAudioMuted, participants = [] }) {
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [isSpeakingMap, setIsSpeakingMap] = useState({});

  const audioContextRef = useRef(null);
  const analyzersRef = useRef(new Map()); // id -> { analyser, source }
  const animationFrameRef = useRef(null);
  const lastSpokeTimeRef = useRef(new Map()); // id -> timestamp
  const currentSpeakerRef = useRef(null);

  // Initialize or re-use Web AudioContext
  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      const resume = () => {
        ctx.resume();
        window.removeEventListener('click', resume);
        window.removeEventListener('keydown', resume);
      };
      window.addEventListener('click', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
    }

    return () => {
      // Keep context alive during re-renders, close on unmount handled in parent
    };
  }, []);

  // Update audio analyzer nodes when streams change
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const currentMap = analyzersRef.current;
    const activeIds = new Set();

    const mutedPeerIds = new Set();
    participants.forEach((p) => {
      if (p.isMuted) mutedPeerIds.add(p.id);
    });

    // 1. Local stream setup
    if (localStream && !isAudioMuted) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].enabled) {
        activeIds.add('local');
        if (!currentMap.has('local')) {
          try {
            const source = ctx.createMediaStreamSource(localStream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.4;
            source.connect(analyser);
            currentMap.set('local', { analyser, source });
          } catch (e) {
            // Source could already be connected or restricted
          }
        }
      }
    }

    // 2. Remote streams setup
    if (remoteStreams && remoteStreams.size > 0) {
      remoteStreams.forEach((stream, peerId) => {
        if (!stream || mutedPeerIds.has(peerId)) return;
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks.some((t) => t.enabled)) {
          activeIds.add(peerId);
          if (!currentMap.has(peerId)) {
            try {
              const source = ctx.createMediaStreamSource(stream);
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 512;
              analyser.smoothingTimeConstant = 0.4;
              source.connect(analyser);
              currentMap.set(peerId, { analyser, source });
            } catch (e) {
              // Ignore stream setup error
            }
          }
        }
      });
    }

    // Remove obsolete analyzers
    for (const [id, { source }] of currentMap.entries()) {
      if (!activeIds.has(id)) {
        try {
          source.disconnect();
        } catch {}
        currentMap.delete(id);
      }
    }
  }, [localStream, remoteStreams, isAudioMuted, participants]);

  const isAudioMutedRef = useRef(isAudioMuted);
  isAudioMutedRef.current = isAudioMuted;
  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  // Audio level polling loop using requestAnimationFrame
  useEffect(() => {
    let isRunning = true;
    const SPEAKING_THRESHOLD = 18; // Audio volume cutoff
    const HOLD_TIME_MS = 1800; // Keep speaker active for 1.8s after sound ends to prevent layout jitter

    const analyzeAudio = () => {
      if (!isRunning) return;

      const now = Date.now();
      const currentMap = analyzersRef.current;
      const nextSpeakingMap = {};
      let maxVol = 0;
      let loudestSpeakerId = null;

      const mutedPeerIds = new Set();
      (participantsRef.current || []).forEach((p) => {
        if (p.isMuted) mutedPeerIds.add(p.id);
      });

      const buffer = new Uint8Array(256);

      currentMap.forEach(({ analyser }, id) => {
        if (id === 'local' && isAudioMutedRef.current) {
          nextSpeakingMap[id] = false;
          return;
        }
        if (mutedPeerIds.has(id)) {
          nextSpeakingMap[id] = false;
          return;
        }

        try {
          analyser.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i];
          }
          const avg = sum / buffer.length;

          if (avg > SPEAKING_THRESHOLD) {
            nextSpeakingMap[id] = true;
            lastSpokeTimeRef.current.set(id, now);
            if (avg > maxVol) {
              maxVol = avg;
              loudestSpeakerId = id;
            }
          } else {
            const lastSpoke = lastSpokeTimeRef.current.get(id) || 0;
            if (now - lastSpoke < 300) {
              nextSpeakingMap[id] = true;
            } else {
              nextSpeakingMap[id] = false;
            }
          }
        } catch {
          nextSpeakingMap[id] = false;
        }
      });

      setIsSpeakingMap(nextSpeakingMap);

      // Determine active speaker with hold time
      if (loudestSpeakerId) {
        currentSpeakerRef.current = loudestSpeakerId;
        setActiveSpeakerId(loudestSpeakerId);
      } else if (currentSpeakerRef.current) {
        if (
          (currentSpeakerRef.current === 'local' && isAudioMutedRef.current) ||
          mutedPeerIds.has(currentSpeakerRef.current)
        ) {
          currentSpeakerRef.current = null;
          setActiveSpeakerId(null);
        } else {
          const lastSpoke = lastSpokeTimeRef.current.get(currentSpeakerRef.current) || 0;
          if (now - lastSpoke > HOLD_TIME_MS) {
            currentSpeakerRef.current = null;
            setActiveSpeakerId(null);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    activeSpeakerId,
    isSpeakingMap,
    hasActiveSpeaker: Boolean(activeSpeakerId)
  };
}
