/**
 * Voice Chat Core Manager
 * Coordinates WebRTC connections, API calls, and WebSocket signaling
 */

import VoiceChatApi from './VoiceChatApi';
import WebRTCManager from './WebRTCManager';
import Events from '../../../utils/events.ts';
import { playbackManager } from '../../../components/playback/playbackmanager';

class VoiceChatCore {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.api = new VoiceChatApi(apiClient);
        this.webrtc = new WebRTCManager();
        this.groupId = null;
        this.isActive = false;
        this.participants = [];
        this.configuration = null;
        this.isMuted = false;
        this.remoteStreams = new Map(); // sessionId -> {stream, audioElement}
        this.mediaVolume = 1.0;
        this.voiceVolume = 1.0;

        // Bind WebRTC callbacks
        this.webrtc.onSignal((toSessionId, type, data) => {
            this.sendSignal(toSessionId, type, data);
        });

        this.webrtc.onRemoteStream((sessionId, stream) => {
            this.handleRemoteStream(sessionId, stream);
        });

        this.webrtc.onRemoteStreamRemoved((sessionId) => {
            this.removeRemoteStream(sessionId);
        });

        console.log('[VoiceChatCore] Initialized');
    }

    /**
     * Join voice chat for a group
     * @param {string} groupId - The group ID
     */
    async join(groupId) {
        try {
            console.log('[VoiceChatCore] Joining voice chat for group:', groupId);
            this.groupId = groupId;

            // Get configuration
            if (!this.configuration) {
                this.configuration = await this.api.getConfiguration();

                // Convert ICE server configuration from PascalCase to camelCase for WebRTC
                const iceServers = (this.configuration.IceServers || []).map(server => {
                    const config = {
                        urls: server.Urls || server.urls
                    };

                    if (server.Username || server.username) {
                        config.username = server.Username || server.username;
                    }

                    if (server.Credential || server.credential) {
                        config.credential = server.Credential || server.credential;
                    }

                    if (server.CredentialType || server.credentialType) {
                        config.credentialType = server.CredentialType || server.credentialType;
                    }

                    return config;
                });

                this.webrtc.initialize(iceServers);
            }

            // Start local stream
            await this.webrtc.startLocalStream();

            // Join voice chat on server
            const state = await this.api.joinVoiceChat(groupId);
            this.participants = state.Participants || [];
            this.mySessionId = state.MySessionId; // Store our session ID
            this.isActive = true;

            console.log('[VoiceChatCore] Joined voice chat. My session:', this.mySessionId, 'Participants:', this.participants);

            // Create peer connections with existing participants FIRST (while stream is active)
            // Only create offer if our session ID is smaller (lexicographically) to avoid glare
            this.participants.forEach(participant => {
                // Don't create connection to ourselves
                if (participant.SessionId !== this.mySessionId) {
                    // Use tie-breaker: only the peer with smaller session ID initiates
                    if (this.mySessionId < participant.SessionId) {
                        console.log('[VoiceChatCore] Creating offer to', participant.SessionId, '(my ID is smaller)');
                        this.webrtc.createOffer(participant.SessionId);
                    } else {
                        console.log('[VoiceChatCore] Waiting for offer from', participant.SessionId, '(their ID is smaller)');
                    }
                }
            });

            // Start unmuted so peer connections have audio tracks
            // User can manually mute if desired
            this.isMuted = false;

            Events.trigger(this, 'voicechat:joined', [{ groupId, participants: this.participants }]);
            return state;
        } catch (error) {
            console.error('[VoiceChatCore] Error joining voice chat:', error);
            this.cleanup();
            throw error;
        }
    }

    /**
     * Leave voice chat
     */
    async leave() {
        try {
            if (!this.groupId) {
                return;
            }

            console.log('[VoiceChatCore] Leaving voice chat for group:', this.groupId);

            await this.api.leaveVoiceChat(this.groupId);
            this.cleanup();

            Events.trigger(this, 'voicechat:left', [{ groupId: this.groupId }]);
        } catch (error) {
            console.error('[VoiceChatCore] Error leaving voice chat:', error);
            this.cleanup();
        }
    }

    /**
     * Send WebRTC signal to server
     * @param {string} toSessionId - Target session ID (null for broadcast)
     * @param {string} type - Signal type
     * @param {Object} data - Signal data
     */
    async sendSignal(toSessionId, type, data) {
        if (!this.groupId) {
            return;
        }

        try {
            const signal = {
                GroupId: this.groupId,
                ToSessionId: toSessionId,
                Type: type,
                Data: JSON.stringify(data)
            };

            await this.api.sendSignal(signal);
        } catch (error) {
            console.error('[VoiceChatCore] Error sending signal:', error);
        }
    }

    /**
     * Handle incoming WebRTC signal
     * @param {Object} signal - Voice chat signal
     */
    async handleSignal(signal) {
        if (!this.isActive || signal.GroupId !== this.groupId) {
            return;
        }

        console.log('[VoiceChatCore] Received signal:', signal.Type, 'from', signal.FromSessionId);

        try {
            const data = signal.Data ? JSON.parse(signal.Data) : null;

            switch (signal.Type) {
                case 'UserJoined':
                    await this.handleUserJoined(data);
                    break;

                case 'UserLeft':
                    this.handleUserLeft(data);
                    break;

                case 'UserMuted':
                case 'UserUnmuted':
                    this.handleUserMuteChanged(data);
                    break;

                case 'Offer':
                case 'Answer':
                case 'IceCandidate':
                    await this.webrtc.handleSignal(signal.FromSessionId, signal.Type, data);
                    break;

                default:
                    console.warn('[VoiceChatCore] Unknown signal type:', signal.Type);
            }
        } catch (error) {
            console.error('[VoiceChatCore] Error handling signal:', error);
        }
    }

    /**
     * Handle user joined voice chat
     * @param {Object} participant - Participant data
     */
    async handleUserJoined(participant) {
        console.log('[VoiceChatCore] User joined:', participant.UserName);
        this.participants.push(participant);

        // Apply tie-breaker: only create offer if our session ID is smaller
        if (this.mySessionId && this.mySessionId < participant.SessionId) {
            console.log('[VoiceChatCore] Creating offer to new participant', participant.SessionId, '(my ID is smaller)');
            await this.webrtc.createOffer(participant.SessionId);
        } else {
            console.log('[VoiceChatCore] Waiting for offer from new participant', participant.SessionId, '(their ID is smaller)');
        }

        Events.trigger(this, 'voicechat:userjoined', [{ participant }]);
    }

    /**
     * Handle user left voice chat
     * @param {Object} participant - Participant data
     */
    handleUserLeft(participant) {
        console.log('[VoiceChatCore] User left:', participant.UserName);
        this.participants = this.participants.filter(p => p.SessionId !== participant.SessionId);
        this.webrtc.removePeerConnection(participant.SessionId);
        this.removeRemoteStream(participant.SessionId);

        Events.trigger(this, 'voicechat:userleft', [{ participant }]);
    }

    /**
     * Handle user mute status changed
     * @param {Object} participant - Participant data
     */
    handleUserMuteChanged(participant) {
        const existing = this.participants.find(p => p.SessionId === participant.SessionId);
        if (existing) {
            existing.IsMuted = participant.IsMuted;
            Events.trigger(this, 'voicechat:mutechanged', [{ participant }]);
        }
    }

    /**
     * Handle remote audio stream
     * @param {string} sessionId - Remote session ID
     * @param {MediaStream} stream - Remote media stream
     */
    handleRemoteStream(sessionId, stream) {
        console.log('[VoiceChatCore] Received remote stream from', sessionId);

        // Remove old stream if exists
        this.removeRemoteStream(sessionId);

        // Create audio element for remote stream
        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        audioElement.playsInline = true; // Prevent phone from entering "call mode"
        audioElement.srcObject = stream;
        audioElement.volume = 1.0;
        document.body.appendChild(audioElement);

        this.remoteStreams.set(sessionId, { stream, audioElement });

        Events.trigger(this, 'voicechat:remotestream', [{ sessionId, stream }]);
    }

    /**
     * Remove remote audio stream
     * @param {string} sessionId - Remote session ID
     */
    removeRemoteStream(sessionId) {
        if (this.remoteStreams.has(sessionId)) {
            const { audioElement } = this.remoteStreams.get(sessionId);
            if (audioElement && audioElement.parentNode) {
                audioElement.pause();
                audioElement.srcObject = null;
                audioElement.parentNode.removeChild(audioElement);
            }
            this.remoteStreams.delete(sessionId);
            console.log('[VoiceChatCore] Removed remote stream for', sessionId);
        }
    }

    /**
     * Toggle mute status
     */
    async toggleMute() {
        this.isMuted = !this.isMuted;
        this.webrtc.setMuted(this.isMuted);

        if (this.groupId) {
            try {
                await this.api.updateMuteStatus(this.groupId, this.isMuted);
                Events.trigger(this, 'voicechat:localmute', [{ isMuted: this.isMuted }]);
            } catch (error) {
                console.error('[VoiceChatCore] Error updating mute status:', error);
            }
        }
    }

    /**
     * Set volume for a remote participant
     * @param {string} sessionId - Session ID
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setRemoteVolume(sessionId, volume) {
        if (this.remoteStreams.has(sessionId)) {
            const { audioElement } = this.remoteStreams.get(sessionId);
            if (audioElement) {
                audioElement.volume = Math.max(0, Math.min(1, volume));
            }
        }
    }

    /**
     * Check if native voice chat support is available (mobile apps)
     * @returns {boolean}
     */
    hasNativeSupport() {
        return !!(window.NativeVoiceChat && window.NativeVoiceChat.isSupported);
    }

    /**
     * Set media volume (0.0 to 1.0)
     * Controls the media playback volume independently of voice chat
     * @param {number} volume - Volume level
     */
    setMediaVolume(volume) {
        this.mediaVolume = Math.max(0, Math.min(1, volume));

        // Set the actual player volume (playbackManager expects 0-100)
        const volumePercent = Math.round(this.mediaVolume * 100);

        // On mobile browsers, playbackManager.setVolume may be ignored due to
        // physical volume control check. Call the player's setVolume directly.
        const currentPlayer = playbackManager.getCurrentPlayer();
        if (currentPlayer && typeof currentPlayer.setVolume === 'function') {
            currentPlayer.setVolume(volumePercent);
            console.log('[VoiceChatCore] Set media volume via player:', volumePercent);
        } else {
            // Fallback to playbackManager
            playbackManager.setVolume(volumePercent);
            console.log('[VoiceChatCore] Set media volume via playbackManager:', volumePercent);
        }

        // Also update via native bridge if available
        if (this.hasNativeSupport()) {
            window.NativeVoiceChat.setMediaVolume(this.mediaVolume);
            console.log('[VoiceChatCore] Set media volume via native:', this.mediaVolume);
        }
    }

    /**
     * Set voice chat volume (0.0 to 1.0)
     * Controls all remote voice streams
     * @param {number} volume - Volume level
     */
    setVoiceChatVolume(volume) {
        this.voiceVolume = Math.max(0, Math.min(1, volume));

        // Update all remote audio elements
        this.remoteStreams.forEach(({ audioElement }) => {
            if (audioElement) {
                audioElement.volume = this.voiceVolume;
            }
        });

        // Also update via native bridge if available
        if (this.hasNativeSupport()) {
            window.NativeVoiceChat.setVoiceVolume(this.voiceVolume);
            console.log('[VoiceChatCore] Set voice volume via native:', this.voiceVolume);
        }
    }

    /**
     * Get current media volume
     * @returns {number}
     */
    getMediaVolume() {
        // Get actual volume from playbackManager (returns 0-100), convert to 0-1
        const currentPlayer = playbackManager.getCurrentPlayer();
        if (currentPlayer && typeof currentPlayer.getVolume === 'function') {
            return currentPlayer.getVolume() / 100;
        }
        return this.mediaVolume;
    }

    /**
     * Get current voice chat volume
     * @returns {number}
     */
    getVoiceChatVolume() {
        return this.voiceVolume;
    }

    /**
     * Request microphone permission (for mobile apps)
     * @returns {Promise<boolean>}
     */
    async requestMicrophonePermission() {
        if (this.hasNativeSupport()) {
            try {
                // Check if already has permission
                if (typeof window.NativeVoiceChat.hasMicrophonePermission === 'function') {
                    const hasPermission = window.NativeVoiceChat.hasMicrophonePermission();
                    if (hasPermission === true || hasPermission === 'true') {
                        return true;
                    }
                }

                // Request permission
                if (typeof window.NativeVoiceChat.requestMicrophonePermission === 'function') {
                    window.NativeVoiceChat.requestMicrophonePermission();
                    // On mobile, this returns asynchronously via callback
                    return true;
                }
            } catch (error) {
                console.error('[VoiceChatCore] Error requesting microphone permission:', error);
            }
        }

        // For web, getUserMedia will prompt for permission
        return true;
    }

    /**
     * Cleanup voice chat resources
     */
    cleanup() {
        this.isActive = false;
        this.participants = [];
        this.groupId = null;

        // Remove all remote streams
        this.remoteStreams.forEach((_, sessionId) => {
            this.removeRemoteStream(sessionId);
        });

        // Cleanup WebRTC
        this.webrtc.cleanup();

        // Restore native audio session if available
        if (this.hasNativeSupport()) {
            try {
                if (typeof window.NativeVoiceChat.restoreAudioSession === 'function') {
                    window.NativeVoiceChat.restoreAudioSession();
                    console.log('[VoiceChatCore] Restored native audio session');
                }
            } catch (error) {
                console.error('[VoiceChatCore] Error restoring audio session:', error);
            }
        }

        console.log('[VoiceChatCore] Cleaned up');
    }

    /**
     * Get current voice chat state
     * @returns {Object}
     */
    getState() {
        return {
            isActive: this.isActive,
            groupId: this.groupId,
            participants: this.participants,
            isMuted: this.isMuted,
            remoteStreamsCount: this.remoteStreams.size
        };
    }
}

export default VoiceChatCore;
