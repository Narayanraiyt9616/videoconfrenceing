import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VideoCard } from './VideoCard.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useActiveSpeaker } from '../../hooks/useActiveSpeaker.js';
import { Share2, LayoutGrid, UserCheck, Sparkles, MonitorUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function VideoGrid({
  localStream,
  remoteStreams,
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  onInviteClick
}) {
  const { participant, participants } = useSocket();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Layout mode preference: 'auto' | 'grid' | 'speaker'
  const [layoutMode, setLayoutMode] = useState('auto');

  // Filter remote participants
  const remoteParticipants = useMemo(() => {
    return participants.filter((p) => p.id !== participant?.id);
  }, [participants, participant?.id]);

  const totalCount = 1 + remoteParticipants.length;

  // Active speaker detection hook
  const { activeSpeakerId, isSpeakingMap, hasActiveSpeaker } = useActiveSpeaker({
    localStream,
    remoteStreams,
    isAudioMuted
  });

  // Track container dimensions with ResizeObserver for exact mathematical grid fitting
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setDimensions({
        width: el.clientWidth || window.innerWidth,
        height: el.clientHeight || window.innerHeight
      });
    };

    updateSize();

    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // Check if someone is sharing screen
  const screenSharer = useMemo(() => {
    if (isScreenSharing) return { id: 'local', isLocal: true };
    const remoteSharer = remoteParticipants.find((p) => p.isScreenSharing);
    if (remoteSharer) return { id: remoteSharer.id, isLocal: false, peer: remoteSharer };
    return null;
  }, [isScreenSharing, remoteParticipants]);

  // Determine whether to use Active Speaker Spotlight Layout
  const isSpeakerModeActive = useMemo(() => {
    if (screenSharer) return true; // Screen sharing always triggers spotlight
    if (layoutMode === 'grid') return false; // Explicit user preference
    if (layoutMode === 'speaker') return true; // Explicit user preference
    // 'auto' mode: only spotlight if >= 3 participants and someone is active
    return totalCount >= 3 && hasActiveSpeaker;
  }, [layoutMode, totalCount, hasActiveSpeaker, screenSharer]);

  // Calculate dynamic grid dimensions to maximize tile sizes within container
  const gridStyle = useMemo(() => {
    const { width, height } = dimensions;
    if (!width || !height || totalCount === 0) return {};

    const gap = 12;
    const padding = 16;
    const availableW = Math.max(width - padding * 2, 200);
    const availableH = Math.max(height - padding * 2, 200);

    let bestCols = 1;
    let maxArea = 0;
    let bestWidth = 0;
    let bestHeight = 0;

    const targetAspect = 16 / 9;

    // Test column counts from 1 up to totalCount to find layout with maximum tile size
    for (let c = 1; c <= totalCount; c++) {
      const r = Math.ceil(totalCount / c);
      const totalGapW = gap * (c - 1);
      const totalGapH = gap * (r - 1);

      const maxTileW = (availableW - totalGapW) / c;
      const maxTileH = (availableH - totalGapH) / r;

      if (maxTileW <= 0 || maxTileH <= 0) continue;

      // Fit into target aspect ratio (allow flexibility between 1.3 and 1.8)
      let w = maxTileW;
      let h = w / targetAspect;

      if (h > maxTileH) {
        h = maxTileH;
        w = h * targetAspect;
      }

      const area = w * h;
      if (area > maxArea) {
        maxArea = area;
        bestCols = c;
        bestWidth = Math.floor(w);
        bestHeight = Math.floor(h);
      }
    }

    return {
      gridTemplateColumns: `repeat(${bestCols}, minmax(0, 1fr))`,
      maxWidth: `${availableW}px`,
      maxHeight: `${availableH}px`
    };
  }, [dimensions, totalCount]);

  // Determine who is currently featured in Speaker / Spotlight layout
  const featuredTarget = useMemo(() => {
    if (screenSharer) {
      if (screenSharer.isLocal) {
        return { isLocal: true, participant, stream: localStream };
      }
      return {
        isLocal: false,
        participant: screenSharer.peer,
        stream: remoteStreams.get(screenSharer.id)
      };
    }

    if (activeSpeakerId === 'local') {
      return { isLocal: true, participant, stream: localStream };
    }

    const remoteSpeaker = remoteParticipants.find((p) => p.id === activeSpeakerId);
    if (remoteSpeaker) {
      return {
        isLocal: false,
        participant: remoteSpeaker,
        stream: remoteStreams.get(remoteSpeaker.id)
      };
    }

    // Default to first remote participant or local
    if (remoteParticipants.length > 0) {
      return {
        isLocal: false,
        participant: remoteParticipants[0],
        stream: remoteStreams.get(remoteParticipants[0].id)
      };
    }

    return { isLocal: true, participant, stream: localStream };
  }, [screenSharer, activeSpeakerId, participant, localStream, remoteParticipants, remoteStreams]);

  // Strip participants for secondary bar in speaker mode
  const secondaryParticipants = useMemo(() => {
    const list = [];
    // If featured is NOT local, put local in strip
    if (!featuredTarget.isLocal) {
      list.push({ isLocal: true, participant, stream: localStream });
    }
    // Remote participants except the featured one
    remoteParticipants.forEach((p) => {
      if (featuredTarget.isLocal || p.id !== featuredTarget.participant?.id) {
        list.push({ isLocal: false, participant: p, stream: remoteStreams.get(p.id) });
      }
    });
    return list;
  }, [featuredTarget, participant, localStream, remoteParticipants, remoteStreams]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden"
    >
      {/* Layout Control / Invite Floating Pill */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Alone in room invite banner */}
        {totalCount === 1 ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-[#181818]/90 border border-[#2e2e2e] text-white flex items-center gap-2.5 text-xs shadow-xl backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#ffa31a] animate-ping" />
            <span className="text-zinc-300">
              <strong className="text-[#ffa31a]">Waiting for friends...</strong> Share room link to start
            </span>
            <button
              onClick={onInviteClick}
              className="ml-1 px-2.5 py-1 rounded-lg bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-md"
            >
              <Share2 className="w-3 h-3 text-black" />
              <span>INVITE</span>
            </button>
          </motion.div>
        ) : (
          <div />
        )}

        {/* Layout Switcher (Grid vs Active Speaker Spotlight) */}
        {totalCount >= 2 && (
          <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-[#141414]/90 border border-[#2c2c2c] backdrop-blur-md shadow-xl text-xs font-bold text-zinc-400">
            <button
              type="button"
              onClick={() => setLayoutMode('auto')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                layoutMode === 'auto'
                  ? 'bg-[#ffa31a] text-black font-black shadow-sm'
                  : 'hover:text-white'
              }`}
              title="Auto Layout (Grid or Active Speaker)"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Auto</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                layoutMode === 'grid'
                  ? 'bg-[#ffa31a] text-black font-black shadow-sm'
                  : 'hover:text-white'
              }`}
              title="Balanced Grid Layout"
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('speaker')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                layoutMode === 'speaker'
                  ? 'bg-[#ffa31a] text-black font-black shadow-sm'
                  : 'hover:text-white'
              }`}
              title="Speaker Spotlight Layout"
            >
              <UserCheck className="w-3 h-3" />
              <span className="hidden sm:inline">Speaker</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. SPEAKER / SPOTLIGHT LAYOUT */}
      {isSpeakerModeActive ? (
        <div className="w-full h-full flex flex-col md:flex-row gap-3 items-center justify-center p-1 sm:p-2 pt-10">
          {/* Main Stage: Featured Active Speaker or Screen Share */}
          <div className="flex-1 w-full h-full max-h-[70vh] md:max-h-full flex items-center justify-center">
            <div className="w-full h-full aspect-video max-w-5xl rounded-2xl overflow-hidden shadow-2xl">
              <VideoCard
                stream={featuredTarget.stream}
                participant={featuredTarget.participant}
                isLocal={featuredTarget.isLocal}
                isMuted={
                  featuredTarget.isLocal
                    ? isAudioMuted
                    : featuredTarget.participant?.isMuted
                }
                isCameraOff={
                  featuredTarget.isLocal
                    ? isVideoOff
                    : featuredTarget.participant?.isCameraOff
                }
                isScreenSharing={
                  featuredTarget.isLocal
                    ? isScreenSharing
                    : featuredTarget.participant?.isScreenSharing
                }
                isSpeaking={Boolean(
                  featuredTarget.isLocal
                    ? isSpeakingMap['local']
                    : isSpeakingMap[featuredTarget.participant?.id]
                )}
                isFeatured={true}
              />
            </div>
          </div>

          {/* Secondary Strip: Other Participants */}
          <div className="w-full md:w-56 lg:w-64 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-36 md:max-h-[85vh] p-1 shrink-0">
            {secondaryParticipants.map((p) => {
              const key = p.isLocal ? 'local' : p.participant.id;
              const isSpeaking = Boolean(isSpeakingMap[key]);
              return (
                <div
                  key={key}
                  className="w-40 md:w-full h-24 md:h-36 shrink-0 rounded-xl overflow-hidden shadow-md"
                >
                  <VideoCard
                    stream={p.stream}
                    participant={p.participant}
                    isLocal={p.isLocal}
                    isMuted={p.isLocal ? isAudioMuted : p.participant.isMuted}
                    isCameraOff={p.isLocal ? isVideoOff : p.participant.isCameraOff}
                    isScreenSharing={
                      p.isLocal ? isScreenSharing : p.participant.isScreenSharing
                    }
                    isSpeaking={isSpeaking}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. DYNAMIC RESPONSIVE BALANCED GRID */
        <div
          className="grid gap-2.5 sm:gap-3.5 w-full h-full items-center justify-center content-center pt-8 sm:pt-6"
          style={gridStyle}
        >
          {/* Local Participant Card */}
          <div className="w-full h-full min-h-[140px] sm:min-h-[180px] flex items-center justify-center">
            <VideoCard
              stream={localStream}
              participant={participant}
              isLocal={true}
              isMuted={isAudioMuted}
              isCameraOff={isVideoOff}
              isScreenSharing={isScreenSharing}
              isSpeaking={Boolean(isSpeakingMap['local'])}
            />
          </div>

          {/* Remote Participant Cards */}
          <AnimatePresence>
            {remoteParticipants.map((peer) => {
              const peerStream = remoteStreams.get(peer.id);
              const isSpeaking = Boolean(isSpeakingMap[peer.id]);
              return (
                <div
                  key={peer.id}
                  className="w-full h-full min-h-[140px] sm:min-h-[180px] flex items-center justify-center"
                >
                  <VideoCard
                    stream={peerStream}
                    participant={peer}
                    isLocal={false}
                    isMuted={peer.isMuted}
                    isCameraOff={peer.isCameraOff}
                    isScreenSharing={peer.isScreenSharing}
                    isSpeaking={isSpeaking}
                  />
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
