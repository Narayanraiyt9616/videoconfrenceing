import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export function useWebRTC() {
  const { socket, participant, updateMediaState } = useSocket();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // peerSocketId -> RTCPeerConnection
  const iceCandidateQueueRef = useRef(new Map()); // peerSocketId -> RTCIceCandidate[]
  const isAudioMutedRef = useRef(false);
  const isVideoOffRef = useRef(false);

  // Helper to create a fallback dummy animated video & silent audio stream if hardware camera is not available
  const createFallbackStream = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      let frame = 0;
      const draw = () => {
        frame++;
        ctx.fillStyle = '#050a14';
        ctx.fillRect(0, 0, 640, 480);

        // Cyber matrix grid lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 640; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 480);
          ctx.stroke();
        }
        for (let y = 0; y < 480; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(640, y);
          ctx.stroke();
        }

        // Animated glowing cyan pulse orb
        const grad = ctx.createRadialGradient(
          320 + Math.sin(frame / 18) * 40,
          240 + Math.cos(frame / 18) * 30,
          20,
          320,
          240,
          180
        );
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.5)');
        grad.addColorStop(0.5, 'rgba(0, 100, 255, 0.2)');
        grad.addColorStop(1, 'rgba(5, 10, 20, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);

        // Cyber corner brackets
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 40, 560, 400);

        // Avatar & Operator text
        ctx.font = '50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(participant?.avatar || '⚡', 320, 210);

        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillText(`[OPERATOR: ${(participant?.name || 'AGENT').toUpperCase()}]`, 320, 270);

        ctx.fillStyle = '#00ff66';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('STATUS: NEURAL LINK ACTIVE // ENCRYPTED', 320, 305);
      };

      const interval = setInterval(draw, 66); // ~15 fps
      const stream = canvas.captureStream(15);

      // Add dummy silent audio track via Web Audio
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const actx = new AudioCtx();
        const osc = actx.createOscillator();
        const dest = actx.createMediaStreamDestination();
        const gain = actx.createGain();
        gain.gain.value = 0.0001; // nearly silent
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) stream.addTrack(audioTrack);
      }

      // Store cleanup on stream
      stream._cleanup = () => clearInterval(interval);
      return stream;
    } catch {
      return new MediaStream();
    }
  }, [participant]);

  // Flush any buffered ICE candidates once remoteDescription is set
  const drainIceCandidates = useCallback(async (peerId, pc) => {
    const queue = iceCandidateQueueRef.current.get(peerId);
    if (!queue || queue.length === 0) return;

    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`[WebRTC] Failed to add buffered ICE candidate for ${peerId}:`, err);
      }
    }
  }, []);

  // Helper to create or retrieve Peer Connection
  const createPeerConnection = useCallback(
    (peerId) => {
      if (peersRef.current.has(peerId)) {
        const existingPc = peersRef.current.get(peerId);
        // Ensure tracks are attached
        if (localStreamRef.current) {
          const senders = existingPc.getSenders();
          localStreamRef.current.getTracks().forEach((track) => {
            if (track.kind === 'audio') {
              track.enabled = !isAudioMutedRef.current;
            } else if (track.kind === 'video') {
              track.enabled = !isVideoOffRef.current;
            }
            const hasTrack = senders.some((s) => s.track && s.track.kind === track.kind);
            if (!hasTrack) {
              existingPc.addTrack(track, localStreamRef.current);
            }
          });
        }
        return existingPc;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (track.kind === 'audio') {
            track.enabled = !isAudioMutedRef.current;
          } else if (track.kind === 'video') {
            track.enabled = !isVideoOffRef.current;
          }
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // On local ICE candidate generated
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('video:ice-candidate', {
            to: peerId,
            candidate: event.candidate
          });
        }
      };

      // On remote track received (audio or video)
      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          let streamToUse;
          const existingStream = next.get(peerId);

          if (event.streams && event.streams[0]) {
            streamToUse = event.streams[0];
          } else if (existingStream) {
            if (!existingStream.getTracks().some((t) => t.id === event.track.id)) {
              existingStream.addTrack(event.track);
            }
            streamToUse = existingStream;
          } else {
            streamToUse = new MediaStream([event.track]);
          }

          next.set(peerId, streamToUse);
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
        }
      };

      peersRef.current.set(peerId, pc);
      return pc;
    },
    [socket]
  );

  // Send an offer with all current local tracks to a peer
  const sendOfferToPeer = useCallback(
    async (peerId) => {
      try {
        const pc = createPeerConnection(peerId);

        // Ensure all local tracks are attached before creating offer
        if (localStreamRef.current) {
          const senders = pc.getSenders();
          localStreamRef.current.getTracks().forEach((track) => {
            if (track.kind === 'audio') {
              track.enabled = !isAudioMutedRef.current;
            } else if (track.kind === 'video') {
              track.enabled = !isVideoOffRef.current;
            }
            const hasTrack = senders.some((s) => s.track && s.track.kind === track.kind);
            if (!hasTrack) {
              pc.addTrack(track, localStreamRef.current);
            }
          });
        }

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);

        socket?.emit('video:offer', {
          to: peerId,
          offer
        });
      } catch (err) {
        console.error(`[WebRTC] Error initiating offer to ${peerId}:`, err);
      }
    },
    [createPeerConnection, socket]
  );

  // Acquire local media & establish connections once ready
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        let stream = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 30 } },
              audio: true
            });
          } catch (camErr) {
            console.warn('[WebRTC] Real camera unavailable/blocked, using cyber matrix stream:', camErr);
            if (camErr.name === 'NotAllowedError') {
              toast('Camera/Mic permission blocked. Using avatar feed.', { icon: '🔒' });
            }
            stream = createFallbackStream();
          }
        } else {
          stream = createFallbackStream();
        }

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          if (stream._cleanup) stream._cleanup();
          return;
        }

        // Apply any pre-existing mute or camera off states to captured stream immediately
        if (isAudioMutedRef.current) {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
        }
        if (isVideoOffRef.current) {
          stream.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Attach new tracks to any peer connections that were already opened
        peersRef.current.forEach(async (pc, peerId) => {
          stream.getTracks().forEach((track) => {
            if (track.kind === 'audio') {
              track.enabled = !isAudioMutedRef.current;
            } else if (track.kind === 'video') {
              track.enabled = !isVideoOffRef.current;
            }
            const senders = pc.getSenders();
            const hasTrack = senders.some((s) => s.track && s.track.kind === track.kind);
            if (!hasTrack) {
              pc.addTrack(track, stream);
            }
          });

          // Trigger renegotiation offer so remote peer receives joiner's tracks
          await sendOfferToPeer(peerId);
        });

        // Broadcast to all peers in room that our media stream is ready
        if (socket) {
          socket.emit('video:ready');
        }
      } catch (err) {
        console.error('[WebRTC] Media initialization error:', err);
        setMediaError(err.message);
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        if (localStreamRef.current._cleanup) localStreamRef.current._cleanup();
      }
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      iceCandidateQueueRef.current.clear();
    };
  }, [createFallbackStream, sendOfferToPeer, socket]);

  // Setup WebRTC Socket Signaling Listeners
  useEffect(() => {
    if (!socket) return;

    // A newcomer joined the room
    const handleParticipantJoined = async ({ participant: newPeer }) => {
      if (newPeer.id === socket.id) return;
      // If our local stream is ready, initiate offer
      if (localStreamRef.current) {
        await sendOfferToPeer(newPeer.id);
      }
    };

    // A peer signaled that their media is ready
    const handlePeerVideoReady = async ({ from }) => {
      if (from === socket.id) return;
      if (localStreamRef.current) {
        await sendOfferToPeer(from);
      }
    };

    // Handle incoming SDP Offer
    const handleOffer = async ({ from, offer }) => {
      try {
        const pc = createPeerConnection(from);

        // WebRTC glare resolution: resolve simultaneous offer collisions
        const isPolite = String(socket?.id) > String(from);
        if (pc.signalingState !== 'stable') {
          if (!isPolite) {
            console.log('[WebRTC] Impolite peer ignoring offer collision with', from);
            return;
          }
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch (rbErr) {
            console.warn('[WebRTC] Rollback error:', rbErr);
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Flush any candidates received prior to setting remote description
        await drainIceCandidates(from, pc);

        // Ensure all local tracks are attached before answering
        if (localStreamRef.current) {
          const senders = pc.getSenders();
          localStreamRef.current.getTracks().forEach((track) => {
            if (track.kind === 'audio') {
              track.enabled = !isAudioMutedRef.current;
            } else if (track.kind === 'video') {
              track.enabled = !isVideoOffRef.current;
            }
            const hasTrack = senders.some((s) => s.track && s.track.kind === track.kind);
            if (!hasTrack) {
              pc.addTrack(track, localStreamRef.current);
            }
          });
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('video:answer', {
          to: from,
          answer
        });
      } catch (err) {
        console.error(`[WebRTC] Error processing offer from ${from}:`, err);
      }
    };

    // Handle incoming SDP Answer
    const handleAnswer = async ({ from, answer }) => {
      try {
        const pc = peersRef.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await drainIceCandidates(from, pc);
        }
      } catch (err) {
        console.error(`[WebRTC] Error processing answer from ${from}:`, err);
      }
    };

    // Handle incoming ICE Candidate
    const handleIceCandidate = async ({ from, candidate }) => {
      try {
        const pc = peersRef.current.get(from);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Buffer candidate until remote description is applied
          if (!iceCandidateQueueRef.current.has(from)) {
            iceCandidateQueueRef.current.set(from, []);
          }
          iceCandidateQueueRef.current.get(from).push(candidate);
        }
      } catch (err) {
        console.error(`[WebRTC] Error adding ICE candidate from ${from}:`, err);
      }
    };

    // Handle participant leaving
    const handleParticipantLeft = ({ socketId }) => {
      const pc = peersRef.current.get(socketId);
      if (pc) {
        pc.close();
        peersRef.current.delete(socketId);
      }
      iceCandidateQueueRef.current.delete(socketId);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    };

    socket.on('participant:joined', handleParticipantJoined);
    socket.on('video:ready', handlePeerVideoReady);
    socket.on('video:offer', handleOffer);
    socket.on('video:answer', handleAnswer);
    socket.on('video:ice-candidate', handleIceCandidate);
    socket.on('participant:left', handleParticipantLeft);

    return () => {
      socket.off('participant:joined', handleParticipantJoined);
      socket.off('video:ready', handlePeerVideoReady);
      socket.off('video:offer', handleOffer);
      socket.off('video:answer', handleAnswer);
      socket.off('video:ice-candidate', handleIceCandidate);
      socket.off('participant:left', handleParticipantLeft);
    };
  }, [socket, createPeerConnection, drainIceCandidates, sendOfferToPeer]);

  // Media Controls: Toggle Microphone
  const toggleAudio = useCallback(() => {
    const nextMuted = !isAudioMutedRef.current;
    isAudioMutedRef.current = nextMuted;
    setIsAudioMuted(nextMuted);

    // 1. Mute/unmute localStreamRef tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    // 2. Mute/unmute localStream state tracks if different
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    // 3. Mute/unmute audio senders across all active RTCPeerConnections
    peersRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = !nextMuted;
        }
      });
    });

    // 4. Update room media state
    updateMediaState({ isMuted: nextMuted });
  }, [localStream, updateMediaState]);

  // Media Controls: Toggle Camera
  const toggleVideo = useCallback(() => {
    const nextCameraOff = !isVideoOffRef.current;
    isVideoOffRef.current = nextCameraOff;
    setIsVideoOff(nextCameraOff);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextCameraOff;
      });
    }

    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextCameraOff;
      });
    }

    peersRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === 'video') {
          sender.track.enabled = !nextCameraOff;
        }
      });
    });

    updateMediaState({ isCameraOff: nextCameraOff });
  }, [localStream, updateMediaState]);

  // Handle host force mute if participant state gets isMuted: true
  useEffect(() => {
    if (participant?.isMuted && !isAudioMutedRef.current) {
      isAudioMutedRef.current = true;
      setIsAudioMuted(true);

      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      peersRef.current.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = false;
          }
        });
      });
    }
  }, [participant?.isMuted, localStream]);

  // Media Controls: Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          toast.error('Screen sharing is not supported in this browser.');
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        updateMediaState({ isScreenSharing: true });

        // Replace video track in all active peer connections
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast.error('Could not share screen: ' + err.message);
        }
      }
    } else {
      stopScreenShare();
    }
  }, [isScreenSharing, updateMediaState]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    updateMediaState({ isScreenSharing: false });

    // Restore original local camera track
    if (localStreamRef.current) {
      const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (originalVideoTrack) {
        originalVideoTrack.enabled = !isVideoOffRef.current;
      }
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && originalVideoTrack) {
          sender.replaceTrack(originalVideoTrack);
        }
      });
    }
  }, [updateMediaState]);

  return {
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    mediaError,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };
}
