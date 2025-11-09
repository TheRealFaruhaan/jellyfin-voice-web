/**
 * WebRTC Peer Connection Manager for Voice Chat
 */

class WebRTCManager {
    constructor() {
        this.peerConnections = new Map(); // sessionId -> RTCPeerConnection
        this.localStream = null;
        this.iceServers = [];
        this.onSignalCallback = null;
        this.onRemoteStreamCallback = null;
        this.onRemoteStreamRemovedCallback = null;
    }

    /**
     * Initialize WebRTC manager with ICE servers
     * @param {Array} iceServers - Array of ICE server configurations
     */
    initialize(iceServers) {
        this.iceServers = iceServers || [];
        console.log('[WebRTCManager] Initialized with ICE servers:', this.iceServers);
    }

    /**
     * Set callback for outgoing signals
     * @param {Function} callback - Callback function(toSessionId, type, data)
     */
    onSignal(callback) {
        this.onSignalCallback = callback;
    }

    /**
     * Set callback for remote stream
     * @param {Function} callback - Callback function(sessionId, stream)
     */
    onRemoteStream(callback) {
        this.onRemoteStreamCallback = callback;
    }

    /**
     * Set callback for remote stream removed
     * @param {Function} callback - Callback function(sessionId)
     */
    onRemoteStreamRemoved(callback) {
        this.onRemoteStreamRemovedCallback = callback;
    }

    /**
     * Start local audio stream
     * @returns {Promise<MediaStream>}
     */
    async startLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            console.log('[WebRTCManager] Local stream started');
            return this.localStream;
        } catch (error) {
            console.error('[WebRTCManager] Error starting local stream:', error);
            throw error;
        }
    }

    /**
     * Stop local audio stream
     */
    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
            console.log('[WebRTCManager] Local stream stopped');
        }
    }

    /**
     * Get or create peer connection for a session
     * @param {string} sessionId - Remote session ID
     * @returns {RTCPeerConnection}
     */
    getPeerConnection(sessionId) {
        if (this.peerConnections.has(sessionId)) {
            return this.peerConnections.get(sessionId);
        }

        const config = {
            iceServers: this.iceServers
        };

        const pc = new RTCPeerConnection(config);

        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && this.onSignalCallback) {
                this.onSignalCallback(sessionId, 'IceCandidate', {
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('[WebRTCManager] Remote track received from', sessionId);
            if (this.onRemoteStreamCallback && event.streams[0]) {
                this.onRemoteStreamCallback(sessionId, event.streams[0]);
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`[WebRTCManager] Connection state for ${sessionId}:`, pc.connectionState);
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
                this.removePeerConnection(sessionId);
            }
        };

        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTCManager] ICE connection state for ${sessionId}:`, pc.iceConnectionState);
        };

        this.peerConnections.set(sessionId, pc);
        console.log('[WebRTCManager] Created peer connection for', sessionId);
        return pc;
    }

    /**
     * Create and send an offer to a peer
     * @param {string} sessionId - Remote session ID
     */
    async createOffer(sessionId) {
        try {
            const pc = this.getPeerConnection(sessionId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (this.onSignalCallback) {
                this.onSignalCallback(sessionId, 'Offer', {
                    type: offer.type,
                    sdp: offer.sdp
                });
            }

            console.log('[WebRTCManager] Created offer for', sessionId);
        } catch (error) {
            console.error('[WebRTCManager] Error creating offer:', error);
        }
    }

    /**
     * Handle incoming signal from a peer
     * @param {string} fromSessionId - Sender session ID
     * @param {string} type - Signal type (Offer, Answer, IceCandidate)
     * @param {Object} data - Signal data
     */
    async handleSignal(fromSessionId, type, data) {
        try {
            const pc = this.getPeerConnection(fromSessionId);

            switch (type) {
                case 'Offer':
                    // Handle offer collision - if we're already waiting for answer, ignore the incoming offer
                    if (pc.signalingState === 'have-local-offer') {
                        console.log('[WebRTCManager] Offer collision detected, ignoring incoming offer from', fromSessionId);
                        return;
                    }

                    await pc.setRemoteDescription(new RTCSessionDescription(data));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    if (this.onSignalCallback) {
                        this.onSignalCallback(fromSessionId, 'Answer', {
                            type: answer.type,
                            sdp: answer.sdp
                        });
                    }
                    console.log('[WebRTCManager] Handled offer and sent answer to', fromSessionId);
                    break;

                case 'Answer':
                    // Only set remote description if we're expecting an answer
                    if (pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(data));
                        console.log('[WebRTCManager] Handled answer from', fromSessionId);
                    } else {
                        console.log('[WebRTCManager] Ignoring answer from', fromSessionId, '- not in correct state:', pc.signalingState);
                    }
                    break;

                case 'IceCandidate':
                    if (data.candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(data));
                        console.log('[WebRTCManager] Added ICE candidate from', fromSessionId);
                    }
                    break;

                default:
                    console.warn('[WebRTCManager] Unknown signal type:', type);
            }
        } catch (error) {
            console.error(`[WebRTCManager] Error handling signal from ${fromSessionId}:`, error);
        }
    }

    /**
     * Remove peer connection for a session
     * @param {string} sessionId - Session ID
     */
    removePeerConnection(sessionId) {
        if (this.peerConnections.has(sessionId)) {
            const pc = this.peerConnections.get(sessionId);
            pc.close();
            this.peerConnections.delete(sessionId);
            console.log('[WebRTCManager] Removed peer connection for', sessionId);

            if (this.onRemoteStreamRemovedCallback) {
                this.onRemoteStreamRemovedCallback(sessionId);
            }
        }
    }

    /**
     * Close all peer connections and stop local stream
     */
    cleanup() {
        this.peerConnections.forEach((pc, sessionId) => {
            pc.close();
            console.log('[WebRTCManager] Closed peer connection for', sessionId);
        });
        this.peerConnections.clear();
        this.stopLocalStream();
        console.log('[WebRTCManager] Cleaned up all connections');
    }

    /**
     * Mute/unmute local audio
     * @param {boolean} muted - Whether to mute
     */
    setMuted(muted) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !muted;
            });
            console.log('[WebRTCManager] Local stream muted:', muted);
        }
    }

    /**
     * Check if local stream is muted
     * @returns {boolean}
     */
    isMuted() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            return audioTracks.length > 0 ? !audioTracks[0].enabled : false;
        }
        return false;
    }
}

export default WebRTCManager;
