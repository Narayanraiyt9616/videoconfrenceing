import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:5000';

function createSocket() {
  return io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false
  });
}

async function runMultiUserSimulation() {
  console.log('🔥 STARTING COMPREHENSIVE MULTI-USER HANGOUT SIMULATION 🔥\n');

  // STEP 0: Generate Unique Code
  console.log('0️⃣ Testing Code Generation API...');
  const genRes = await fetch(`${SERVER_URL}/api/rooms/generate-code`);
  const genData = await genRes.json();
  if (!genData.success || !genData.roomCode) throw new Error('Code generation failed');
  console.log(`   ✅ Generated Fresh Unique Code: ${genData.roomCode}`);

  // STEP 1: REST API Room Creation with custom code
  console.log('\n1️⃣ Host creating room with custom generated code via REST API...');
  const res = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomName: 'Dosti Ya Kalesh Hangout 🔥',
      maxParticipants: 5,
      customRoomCode: genData.roomCode
    })
  });
  const roomData = await res.json();
  if (!roomData.success) throw new Error('Room creation failed: ' + roomData.error);
  const roomCode = roomData.roomCode;
  const hostToken = roomData.hostToken;
  console.log(`   ✅ Room Created: ${roomCode} | Host Token: ${hostToken}`);

  // STEP 2: Connecting Sockets
  console.log('\n2️⃣ Connecting sockets via Socket.IO...');
  const socket1 = createSocket();
  const socket2 = createSocket();
  const socket3 = createSocket();

  await Promise.all([
    new Promise((res) => socket1.on('connect', res)),
    new Promise((res) => socket2.on('connect', res)),
    new Promise((res) => socket3.on('connect', res))
  ]);
  console.log(`   ✅ Sockets connected: User1(${socket1.id}), User2(${socket2.id}), User3(${socket3.id})`);

  // STEP 3: Host enters room
  console.log('\n3️⃣ Host joining room...');
  const join1 = await new Promise((res) => {
    socket1.emit('room:join', { roomCode, name: 'Rahul (Host)', avatar: '🔥', isHost: true, hostToken }, res);
  });
  console.log('   ✅ User 1 joined as Host. Room code:', join1.room.code);

  // STEP 4: Door Knocking & Host Approval for User 2
  console.log('\n4️⃣ Testing Door Knocking & Host Approval...');
  const hostKnockPromise = new Promise((res) => socket1.on('host:knock-received', res));
  
  socket2.emit('room:knock', { roomCode, name: 'Priya', avatar: '💀' }, (ack) => {
    console.log(`   ✅ User 2 knock acknowledged: status=${ack.status}`);
  });

  const knockReceived = await hostKnockPromise;
  console.log(`   ✅ Host received knock from: ${knockReceived.name} (${knockReceived.socketId})`);

  const user2ApprovedPromise = new Promise((res) => socket2.on('room:knock-approved', res));
  socket1.emit('host:approve-knock', { targetSocketId: knockReceived.socketId });
  await user2ApprovedPromise;
  console.log('   ✅ User 2 received room:knock-approved event!');

  // Now User 2 joins after approval
  const user2JoinedNotice = new Promise((res) => socket1.on('participant:joined', res));
  const join2 = await new Promise((res) => {
    socket2.emit('room:join', { roomCode, name: 'Priya', avatar: '💀', isHost: false }, res);
  });
  await user2JoinedNotice;
  console.log('   ✅ User 2 (Priya) joined room! Participant count:', join2.room.participants.length);

  // User 3 door knock and approval
  const hostKnock3Promise = new Promise((res) => socket1.on('host:knock-received', res));
  socket3.emit('room:knock', { roomCode, name: 'Aman', avatar: '🤡' });
  const knock3 = await hostKnock3Promise;
  const user3ApprovedPromise = new Promise((res) => socket3.on('room:knock-approved', res));
  socket1.emit('host:approve-knock', { targetSocketId: knock3.socketId });
  await user3ApprovedPromise;

  const user3JoinedNotice = new Promise((res) => socket2.on('participant:joined', res));
  const join3 = await new Promise((res) => {
    socket3.emit('room:join', { roomCode, name: 'Aman', avatar: '🤡', isHost: false }, res);
  });
  await user3JoinedNotice;
  console.log('   ✅ User 3 (Aman) approved and joined. Total participants:', join3.room.participants.length);

  // STEP 5: WebRTC Signaling Mesh
  console.log('\n5️⃣ Testing WebRTC P2P mesh signaling...');
  const answerPromise = new Promise((res) => socket1.on('video:answer', res));
  const offerPromise = new Promise((res) => {
    socket2.on('video:offer', ({ from, offer }) => {
      console.log(`   ✅ User 2 received WebRTC offer from User 1 (${from})`);
      socket2.emit('video:answer', { to: from, answer: { type: 'answer', sdp: 'dummy-sdp-answer' } });
      res();
    });
  });

  socket1.emit('video:offer', { to: socket2.id, offer: { type: 'offer', sdp: 'dummy-sdp-offer' } });
  await Promise.all([offerPromise, answerPromise]);
  console.log('   ✅ User 1 received WebRTC answer from User 2.');

  // STEP 6: Live Chat, Media/GIF Sharing, Reactions & Secret Mode
  console.log('\n6️⃣ Testing Live Chat, Media/GIF Sharing & Anonymous Mode...');
  
  // Normal text message
  const msgPromise = new Promise((res) => socket3.on('chat:message', res));
  socket1.emit('chat:send', { text: 'Welcome to the kalesh room guys!' });
  const msg1 = await msgPromise;
  console.log(`   ✅ Public message received by User 3: "${msg1.text}" from ${msg1.senderName}`);

  // GIF / Media message test (Zero restrictions)
  const gifMsgPromise = new Promise((res) => socket1.on('chat:message', res));
  socket2.emit('chat:send', {
    text: 'Dekho yeh kalesh meme! 😂',
    mediaUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    mediaType: 'gif'
  });
  const gifMsg = await gifMsgPromise;
  console.log(`   ✅ GIF Media message received by Host: "${gifMsg.text}" | Type: ${gifMsg.mediaType} | Media: ${gifMsg.mediaUrl.substring(0, 30)}...`);

  // Reaction to message
  const reactPromise = new Promise((res) => socket1.on('chat:reaction-updated', res));
  socket2.emit('chat:react', { messageId: msg1.id, emoji: '🔥' });
  const reactUpdate = await reactPromise;
  console.log(`   ✅ Reaction recorded: ${JSON.stringify(reactUpdate.reactions)} on msg ${reactUpdate.messageId}`);

  // Anonymous Secret Message
  const secretPromise = new Promise((res) => socket1.on('chat:message', res));
  socket2.emit('chat:send', { text: 'Rahul sabse bada feku hai! 🤫', isSecret: true });
  const secretMsg = await secretPromise;
  console.log(`   ✅ Anonymous Secret Message received: "${secretMsg.text}" | Sender: ${secretMsg.senderName} (${secretMsg.senderAvatar})`);
  if (secretMsg.senderId !== null) throw new Error('Secret message leaked senderId!');

  // STEP 7: Hangout Games & Anonymous Polls
  console.log('\n7️⃣ Testing Hangout Games & Anonymous Polls...');
  const topicPromise = new Promise((res) => socket3.on('topic:updated', res));
  socket1.emit('topic:random');
  const topicData = await topicPromise;
  console.log(`   ✅ Topic Drawn: "${topicData.topic}"`);

  // Who's Most Likely
  const wmlStartPromise = new Promise((res) => socket2.on('whos_most_likely:started', res));
  socket1.emit('whos_most_likely:start', { customQuestion: 'Who will get married first?' });
  const wmlData = await wmlStartPromise;
  console.log(`   ✅ Who's Most Likely started: "${wmlData.question}"`);

  const wmlResultPromise = new Promise((res) => socket1.on('whos_most_likely:result', res));
  socket1.emit('whos_most_likely:vote', { targetId: socket2.id });
  socket2.emit('whos_most_likely:vote', { targetId: socket2.id });
  socket3.emit('whos_most_likely:vote', { targetId: socket2.id });
  const wmlResult = await wmlResultPromise;
  console.log(`   ✅ Who's Most Likely Winner: ${wmlResult.winner?.name} (${wmlResult.maxVotes} votes)`);

  // Anonymous Poll
  const pollCreatedPromise = new Promise((res) => socket3.on('poll:created', res));
  socket1.emit('poll:create', {
    question: 'Late night snack preference?',
    options: ['Maggi 🍜', 'Pizza 🍕', 'Chai Biscuit ☕']
  });
  const poll = await pollCreatedPromise;
  const pollVotePromise = new Promise((res) => socket1.on('poll:updated', res));
  socket2.emit('poll:vote', { pollId: poll.id, optionId: poll.options[0].id });
  const updatedPoll = await pollVotePromise;
  console.log(`   ✅ Anonymous Poll vote: "${updatedPoll.options[0].text}" has ${updatedPoll.options[0].votes} vote(s)`);

  // STEP 8: Permission to Leave Room (Host Approval on Exit)
  console.log('\n8️⃣ Testing Locked Room: Permission to Leave Flow...');
  const hostLeaveReqPromise = new Promise((res) => socket1.on('host:leave-requested', res));
  socket3.emit('room:request-leave', { reason: 'Mummy bula rahi hai khane ke liye 😂' });
  const leaveReq = await hostLeaveReqPromise;
  console.log(`   ✅ Host received leave request from ${leaveReq.name}: "${leaveReq.reason}"`);

  const user3LeaveApprovedPromise = new Promise((res) => socket3.on('room:leave-approved', res));
  socket1.emit('host:approve-leave', { targetSocketId: socket3.id });
  await user3LeaveApprovedPromise;
  console.log('   ✅ User 3 received room:leave-approved event!');

  // User 3 leaves after approval
  const left3Notice = new Promise((res) => socket1.on('participant:left', res));
  socket3.emit('room:leave');
  await left3Notice;
  console.log('   ✅ User 3 officially left the room.');
  socket3.disconnect();

  // STEP 9: Host End Room & Zero Database Verification
  console.log('\n9️⃣ Testing Host Ending Room & RAM Purge...');
  const endNotice = new Promise((res) => socket2.on('room:ended', res));
  socket1.emit('room:end');
  const endInfo = await endNotice;
  console.log(`   ✅ Room ended by Host: ${endInfo.reason}`);
  socket1.disconnect();
  socket2.disconnect();

  // Verify room is purged from RAM
  const checkRes = await fetch(`${SERVER_URL}/api/rooms/${roomCode}`);
  if (checkRes.status === 404) {
    console.log('   ✅ VERIFIED: Room completely eradicated from memory (404 Not Found)!');
  } else {
    throw new Error('Room still exists in memory after being ended!');
  }

  console.log('\n🎊 ALL ADVANCED FEATURES & FLOWS VERIFIED WITH 100% SUCCESS! 🎊\n');
}

runMultiUserSimulation().catch((err) => {
  console.error('\n❌ Simulation error:', err);
  process.exit(1);
});
