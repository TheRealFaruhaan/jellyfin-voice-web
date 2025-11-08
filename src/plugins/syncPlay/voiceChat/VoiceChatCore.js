/**
 * Voice Chat Core Manager
 * Coordinates WebRTC connections, API calls, and WebSocket signaling
 */

import VoiceChatApi from './VoiceChatApi';
import WebRTCManager from './WebRTCManager';
import Events from '../../../utils/events.ts';

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
                this.webrtc.initialize(this.configuration.IceServers);
            }

            // Start local stream
            await this.webrtc.startLocalStream();

            // Join voice chat on server
            const state = await this.api.joinVoiceChat(groupId);
            this.participants = state.Participants || [];
            this.isActive = true;

            console.log('[VoiceChatCore] Joined voice chat. Participants:', this.participants);

            // Create peer connections with existing participants
            this.participants.forEach(participant => {
                // Don't create connection to ourselves
                if (participant.SessionId !== this.apiClient.getCurrentUserId()) {
                    this.webrtc.createOffer(participant.SessionId);
                }
            });

            Events.trigger(this, 'voicechat:joined', { groupId, participants: this.participants });
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

            Events.trigger(this, 'voicechat:left', { groupId: this.groupId });
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

        // Create offer to new participant
        await this.webrtc.createOffer(participant.SessionId);

        Events.trigger(this, 'voicechat:userjoined', { participant });
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

        Events.trigger(this, 'voicechat:userleft', { participant });
    }

    /**
     * Handle user mute status changed
     * @param {Object} participant - Participant data
     */
    handleUserMuteChanged(participant) {
        const existing = this.participants.find(p => p.SessionId === participant.SessionId);
        if (existing) {
            existing.IsMuted = participant.IsMuted;
            Events.trigger(this, 'voicechat:mutechanged', { participant });
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
        audioElement.srcObject = stream;
        audioElement.volume = 1.0;
        document.body.appendChild(audioElement);

        this.remoteStreams.set(sessionId, { stream, audioElement });

        Events.trigger(this, 'voicechat:remotestream', { sessionId, stream });
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
                Events.trigger(this, 'voicechat:localmute', { isMuted: this.isMuted });
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
