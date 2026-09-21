import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

function createSocket() {
  return io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false
  });
}

async function runUpgradesVerification() {
  console.log('🚀 TESTING NEW VIDEO CONFERENCING UPGRADES ON SERVER 🚀\n');

  // 1. TEST EMPTY ROOM GRACE PERIOD (REFRESH RESILIENCE)
  console.log('1️⃣ Testing Empty Room Grace Period (Refresh Resilience)...');
  const createRes = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName: 'Grace Period Test Room', maxParticipants: 5 })
  });
  const roomData = await createRes.json();
  const roomCode = roomData.roomCode;
  const hostToken = roomData.hostToken;
  console.log(`   ✅ Created room: ${roomCode}`);

  const hostSocket = createSocket();
  await new Promise((res) => hostSocket.on('connect', res));
  await new Promise((res) => {
    hostSocket.emit('room:join', { roomCode, name: 'Host User', avatar: '👑', isHost: true, hostToken }, res);
  });
  console.log('   ✅ Host joined room.');

  // Host disconnects (simulating page refresh)
  console.log('   🔄 Simulating host page reload (socket disconnect)...');
  hostSocket.disconnect();
  await new Promise((r) => setTimeout(r, 500));

  // Check if room is still alive (it must NOT be deleted immediately!)
  const checkRes = await fetch(`${SERVER_URL}/api/rooms/${roomCode}`);
  const checkData = await checkRes.json();
  if (checkRes.status !== 200 || !checkData.exists) {
    throw new Error('FAILED: Room was destroyed immediately on disconnect! Grace period not working.');
  }
  console.log('   ✅ SUCCESS: Room is STILL ALIVE during reload! Grace period working as intended.');

  // Host reconnects with same roomCode and hostToken
  const hostSocketReconnected = createSocket();
  await new Promise((res) => hostSocketReconnected.on('connect', res));
  const rejoinRes = await new Promise((res) => {
    hostSocketReconnected.emit('room:join', { roomCode, name: 'Host User', avatar: '👑', isHost: true, hostToken }, res);
  });
  if (!rejoinRes.success || !rejoinRes.participant.isHost) {
    throw new Error('FAILED: Host could not rejoin room with host privileges!');
  }
  console.log('   ✅ SUCCESS: Host reconnected and reclaimed Host status in the same room.');

  // 2. TEST 5-SECOND SHORT VIDEO MESSAGE SHARING
  console.log('\n2️⃣ Testing 5-Second Short Video Message Sharing...');
  const peerSocket = createSocket();
  await new Promise((res) => peerSocket.on('connect', res));

  // Door knock and approve
  const knockPromise = new Promise((res) => hostSocketReconnected.on('host:knock-received', res));
  peerSocket.emit('room:knock', { roomCode, name: 'Video Sharer', avatar: '🎥' });
  const knock = await knockPromise;

  const approvedPromise = new Promise((res) => peerSocket.on('room:knock-approved', res));
  hostSocketReconnected.emit('host:approve-knock', { targetSocketId: knock.socketId });
  await approvedPromise;

  await new Promise((res) => {
    peerSocket.emit('room:join', { roomCode, name: 'Video Sharer', avatar: '🎥', isHost: false }, res);
  });
  console.log('   ✅ Peer joined room.');

  // Send 5-second video message
  const videoMsgPromise = new Promise((res) => hostSocketReconnected.on('chat:message', res));
  const dummy5sVideoDataUrl = 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA';
  peerSocket.emit('chat:send', {
    text: 'Check out this 5-second video clip! 🎬',
    mediaUrl: dummy5sVideoDataUrl,
    mediaType: 'video'
  });
  const videoMsg = await videoMsgPromise;

  if (videoMsg.mediaType !== 'video' || !videoMsg.mediaUrl) {
    throw new Error('FAILED: Video message not properly received!');
  }
  console.log(`   ✅ SUCCESS: Video message broadcasted and received: "${videoMsg.text}" | Type: ${videoMsg.mediaType}`);

  // 3. CLEANUP AND ROOM END
  console.log('\n3️⃣ Cleaning up test room...');
  hostSocketReconnected.emit('room:end');
  await new Promise((r) => setTimeout(r, 400));
  hostSocketReconnected.disconnect();
  peerSocket.disconnect();

  const finalCheck = await fetch(`${SERVER_URL}/api/rooms/${roomCode}`);
  if (finalCheck.status === 404) {
    console.log('   ✅ Room properly purged after host ends room.');
  }

  console.log('\n🎉 ALL NEW UPGRADES VERIFIED END-TO-END! 🎉\n');
}

runUpgradesVerification().catch((err) => {
  console.error('\n❌ Upgrade verification error:', err);
  process.exit(1);
});
