import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

function createSocket() {
  return io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false
  });
}

async function runVerification() {
  console.log('🚀 TESTING DISCORD SOUNDBOARD, REAL-TIME VIDEO FILTERS & HOST CONTROLS 🚀\n');

  // 1. CREATE A NEW EPHEMERAL ROOM
  console.log('1️⃣ Creating ephemeral room...');
  const createRes = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName: 'Test Soundboard & Host Controls', maxParticipants: 5 })
  });
  const roomData = await createRes.json();
  const roomCode = roomData.roomCode;
  const hostToken = roomData.hostToken;
  console.log(`   ✅ Room created: ${roomCode}`);

  // 2. CONNECT HOST AND JOINER
  console.log('\n2️⃣ Connecting Host and Joiner sockets...');
  const hostSocket = createSocket();
  const joinerSocket = createSocket();

  await Promise.all([
    new Promise((res) => hostSocket.on('connect', res)),
    new Promise((res) => joinerSocket.on('connect', res))
  ]);

  const hostJoinRes = await new Promise((res) => {
    hostSocket.emit('room:join', { roomCode, name: 'Host Narayan', avatar: '👑', isHost: true, hostToken }, res);
  });
  if (!hostJoinRes.success || !hostJoinRes.participant.isHost) {
    throw new Error('FAILED: Host join failed or not recognized as host.');
  }
  console.log('   ✅ Host joined successfully with host privileges.');

  const joinerJoinRes = await new Promise((res) => {
    joinerSocket.emit('room:join', { roomCode, name: 'Joiner Amit', avatar: '🔥', isHost: false }, res);
  });
  if (!joinerJoinRes.success || joinerJoinRes.participant.isHost) {
    throw new Error('FAILED: Joiner failed to join or was mistakenly given host.');
  }
  console.log('   ✅ Joiner Amit joined successfully as a standard participant.');

  // Check initial room settings
  if (!joinerJoinRes.room.settings || joinerJoinRes.room.settings.allowJoinerChat !== true) {
    throw new Error('FAILED: Default room settings missing or incorrect.');
  }
  console.log('   ✅ Initial room settings verified (all permissions enabled by default).');

  // 3. TEST HOST SETTINGS UPDATE & PERMISSIONS
  console.log('\n3️⃣ Testing Host Room Settings Update...');
  const settingsUpdatePromise = new Promise((resolve) => {
    joinerSocket.once('room:settings-updated', ({ settings }) => {
      resolve(settings);
    });
  });

  const updateRes = await new Promise((res) => {
    hostSocket.emit(
      'host:update-settings',
      {
        settings: {
          allowJoinerChat: false,
          allowJoinerScreenShare: false,
          allowJoinerSoundboard: true,
          isLocked: true
        }
      },
      res
    );
  });

  if (!updateRes.success) throw new Error('FAILED: host:update-settings failed on server.');
  const broadcastedSettings = await settingsUpdatePromise;
  if (broadcastedSettings.allowJoinerChat !== false || broadcastedSettings.isLocked !== true) {
    throw new Error('FAILED: Broadcasted settings did not reflect host update.');
  }
  console.log('   ✅ SUCCESS: Host updated room settings and joiner received room:settings-updated.');

  // Test chat moderation enforcement
  console.log('   Testing chat restriction enforcement when allowJoinerChat: false...');
  const chatErrorPromise = new Promise((res) => {
    joinerSocket.once('chat:error', res);
  });
  joinerSocket.emit('chat:send', { text: 'Hello while chat is disabled' });
  const chatErr = await chatErrorPromise;
  if (!chatErr || !chatErr.message) throw new Error('FAILED: Joiner chat was not blocked by server.');
  console.log('   ✅ SUCCESS: Joiner chat was rejected with message:', chatErr.message);

  // 4. TEST HOST "MUTE ALL" AND "CAMERA OFF ALL"
  console.log('\n4️⃣ Testing Host Mute All and Camera Off All...');
  const forceMutePromise = new Promise((res) => joinerSocket.once('host:force-mute', res));
  hostSocket.emit('host:mute-all');
  await forceMutePromise;
  console.log('   ✅ SUCCESS: Joiner received host:force-mute.');

  const forceCameraOffPromise = new Promise((res) => joinerSocket.once('host:force-camera-off', res));
  hostSocket.emit('host:camera-off-all');
  await forceCameraOffPromise;
  console.log('   ✅ SUCCESS: Joiner received host:force-camera-off.');

  // 5. TEST DISCORD SOUNDBOARD BROADCAST (PRESET SOUNDS)
  console.log('\n5️⃣ Testing Discord Soundboard Preset Playback Broadcast...');
  const soundPlayedPromise = new Promise((res) => {
    hostSocket.once('soundboard:played', res);
  });

  joinerSocket.emit('soundboard:play', {
    soundId: 'airhorn',
    soundName: 'Air Horn',
    soundEmoji: '📢',
    isCustom: false
  });

  const soundEvent = await soundPlayedPromise;
  if (soundEvent.soundId !== 'airhorn' || soundEvent.playedBy.name !== 'Joiner Amit') {
    throw new Error('FAILED: Soundboard event broadcast incorrect.');
  }
  console.log(`   ✅ SUCCESS: Soundboard played broadcast verified: "${soundEvent.soundEmoji} ${soundEvent.soundName}" played by ${soundEvent.playedBy.name}.`);

  // 6. TEST CUSTOM SOUNDBOARD UPLOAD & ROOM-WIDE ACCESS
  console.log('\n6️⃣ Testing Custom Soundboard Upload, Playback & Deletion...');
  const sampleBase64Audio = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA';

  const customSoundAddedPromise = new Promise((res) => {
    hostSocket.once('soundboard:custom-sound-added', res);
  });

  const uploadRes = await new Promise((res) => {
    joinerSocket.emit(
      'soundboard:upload',
      {
        name: 'Amit Epic Dialogue',
        emoji: '🔥',
        audioData: sampleBase64Audio
      },
      res
    );
  });

  if (!uploadRes.success || !uploadRes.sound) throw new Error('FAILED: Custom sound upload rejected.');
  const addedSound = await customSoundAddedPromise;
  if (addedSound.id !== uploadRes.sound.id || addedSound.name !== 'Amit Epic Dialogue') {
    throw new Error('FAILED: Custom sound broadcast mismatch.');
  }
  console.log(`   ✅ SUCCESS: Custom sound uploaded and broadcast to room: ${addedSound.emoji} ${addedSound.name} (ID: ${addedSound.id})`);

  // Test playing the custom sound
  const customSoundPlayedPromise = new Promise((res) => {
    hostSocket.once('soundboard:played', res);
  });
  joinerSocket.emit('soundboard:play', {
    soundId: addedSound.id,
    soundName: addedSound.name,
    soundEmoji: addedSound.emoji,
    soundUrl: addedSound.audioData,
    isCustom: true
  });
  const customPlayEvent = await customSoundPlayedPromise;
  if (!customPlayEvent.isCustom || customPlayEvent.soundName !== 'Amit Epic Dialogue') {
    throw new Error('FAILED: Custom sound playback broadcast mismatch.');
  }
  console.log('   ✅ SUCCESS: Room-wide playback of custom uploaded sound verified.');

  // Test sound deletion
  const deletePromise = new Promise((res) => {
    joinerSocket.once('soundboard:custom-sound-removed', res);
  });
  const deleteRes = await new Promise((res) => {
    hostSocket.emit('soundboard:delete', { soundId: addedSound.id }, res);
  });
  if (!deleteRes.success) throw new Error('FAILED: Host failed to delete custom sound.');
  const deletedEvent = await deletePromise;
  if (deletedEvent.soundId !== addedSound.id) throw new Error('FAILED: Sound removal broadcast mismatch.');
  console.log('   ✅ SUCCESS: Custom sound deletion broadcast verified.');

  // 7. TEST REAL-TIME VIDEO FILTERS
  console.log('\n7️⃣ Testing Video Filter Sync across Participants...');
  const mediaUpdatedPromise = new Promise((res) => {
    hostSocket.once('participant:media-updated', (data) => {
      if (data.socketId === joinerSocket.id && data.videoFilter) {
        res(data);
      }
    });
  });

  joinerSocket.emit('video:media-state', { videoFilter: 'cyberpunk' });
  const filterUpdate = await mediaUpdatedPromise;
  if (filterUpdate.videoFilter !== 'cyberpunk') {
    throw new Error('FAILED: Video filter was not updated in media state.');
  }
  console.log('   ✅ SUCCESS: Video filter "cyberpunk" propagated in real-time across peers.');

  // 8. TEST ROOM LOCK ENFORCEMENT ON NEW PARTICIPANTS
  console.log('\n8️⃣ Testing Room Lock Enforcement on New Joiners / Knockers...');
  const intruderSocket = createSocket();
  await new Promise((res) => intruderSocket.on('connect', res));

  const intruderJoinRes = await new Promise((res) => {
    intruderSocket.emit('room:join', { roomCode, name: 'Intruder', avatar: '🕵️' }, res);
  });
  if (intruderJoinRes.success) {
    throw new Error('FAILED: Intruder was able to join a locked room!');
  }
  console.log('   ✅ SUCCESS: Locked room rejected intruder join with:', intruderJoinRes.error);

  const intruderKnockRes = await new Promise((res) => {
    intruderSocket.emit('room:knock', { roomCode, name: 'Intruder', avatar: '🕵️' }, res);
  });
  if (intruderKnockRes.success) {
    throw new Error('FAILED: Intruder was able to knock on a locked room!');
  }
  console.log('   ✅ SUCCESS: Locked room rejected intruder knock with:', intruderKnockRes.error);

  // 9. TEST HOST ROLE TRANSFER
  console.log('\n9️⃣ Testing Host Role Transfer...');
  const hostTransferPromise = new Promise((res) => {
    joinerSocket.once('room:host-transferred', res);
  });
  hostSocket.emit('host:transfer-role', { targetSocketId: joinerSocket.id });
  const transferData = await hostTransferPromise;
  if (transferData.newHostId !== joinerSocket.id) {
    throw new Error('FAILED: Host transfer target ID mismatch.');
  }
  console.log(`   ✅ SUCCESS: Host role transferred to ${transferData.newHostName}.`);

  // Cleanup sockets
  hostSocket.disconnect();
  joinerSocket.disconnect();
  intruderSocket.disconnect();

  console.log('\n🎉 ALL SOUNDBOARD, VIDEO FILTERS & HOST CONTROLS VERIFIED SUCCESSFULLY! 🎉\n');
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ VERIFICATION TEST FAILED:\n', err);
    process.exit(1);
  });
