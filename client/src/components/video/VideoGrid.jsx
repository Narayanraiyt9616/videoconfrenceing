import React from 'react';
import { VideoCard } from './VideoCard.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Share2, Radio, Zap } from 'lucide-react';
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

  // Filter other participants
  const remoteParticipants = participants.filter((p) => p.id !== participant?.id);
  const totalCount = 1 + remoteParticipants.length;

  // Compute adaptive responsive grid style
  const getGridClass = () => {
    if (totalCount === 1) return 'grid-cols-1 max-w-2xl';
    if (totalCount === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (totalCount <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl';
    if (totalCount <= 6) return 'grid-cols-2 lg:grid-cols-3 max-w-6xl';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl';
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* If alone in the room, display Hub Invite banner */}
      {totalCount === 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-5 py-2.5 rounded-xl bg-[#181818] border border-[#2e2e2e] text-white flex items-center gap-3 text-xs sm:text-sm shadow-xl"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffa31a] animate-pulse" />
          <span>
            <strong className="text-[#ffa31a]">Waiting for others...</strong> Share your room link to start video chat!
          </span>
          <button
            onClick={onInviteClick}
            className="ml-auto px-3.5 py-1.5 rounded-lg bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Share2 className="w-3.5 h-3.5 text-black" />
            <span>INVITE FRIENDS</span>
          </button>
        </motion.div>
      )}

      {/* Adaptive Hub Video Grid */}
      <div className={`grid ${getGridClass()} gap-3 sm:gap-4 w-full justify-center items-center`}>
        {/* Local Participant Card */}
        <VideoCard
          stream={localStream}
          participant={participant}
          isLocal={true}
          isMuted={isAudioMuted}
          isCameraOff={isVideoOff}
          isScreenSharing={isScreenSharing}
        />

        {/* Remote Participant Cards */}
        <AnimatePresence>
          {remoteParticipants.map((peer) => {
            const peerStream = remoteStreams.get(peer.id);
            return (
              <VideoCard
                key={peer.id}
                stream={peerStream}
                participant={peer}
                isLocal={false}
                isMuted={peer.isMuted}
                isCameraOff={peer.isCameraOff}
                isScreenSharing={peer.isScreenSharing}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
