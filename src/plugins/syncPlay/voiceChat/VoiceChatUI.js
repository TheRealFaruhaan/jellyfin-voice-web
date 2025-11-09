/**
 * Voice Chat UI Component
 * Provides UI controls for voice chat in SyncPlay
 */

import Events from '../../../utils/events.ts';

class VoiceChatUI {
    constructor(voiceChatCore, manager) {
        this.core = voiceChatCore;
        this.manager = manager;
        this.container = null;
        this.joinButton = null;
        this.muteButton = null;
        this.leaveButton = null;
        this.participantsList = null;

        // Bind event listeners
        Events.on(this.core, 'voicechat:joined', (e, data) => this.onJoined(data));
        Events.on(this.core, 'voicechat:left', () => this.onLeft());
        Events.on(this.core, 'voicechat:userjoined', (e, data) => this.onUserJoined(data));
        Events.on(this.core, 'voicechat:userleft', (e, data) => this.onUserLeft(data));
        Events.on(this.core, 'voicechat:mutechanged', (e, data) => this.onMuteChanged(data));
        Events.on(this.core, 'voicechat:localmute', (e, data) => this.onLocalMuteChanged(data));
    }

    /**
     * Create and show the voice chat UI
     * Note: Voice chat controls are now integrated into the video player OSD.
     * No floating overlay is created.
     * @param {HTMLElement} parentElement - Parent element to attach UI to
     */
    create(parentElement) {
        // Voice chat buttons are now fully integrated into the video player controls
        // No floating UI needed - everything is handled by the video player OSD button
        console.log('[VoiceChatUI] Voice chat UI initialized (OSD-only mode)');
    }


    /**
     * Join voice chat
     */
    async join() {
        // Use manager's joinVoiceChat method
        if (this.manager) {
            await this.manager.joinVoiceChat();
        } else {
            console.error('Manager not available for voice chat');
        }
    }

    /**
     * Toggle mute
     */
    async toggleMute() {
        await this.core.toggleMute();
    }

    /**
     * Leave voice chat
     */
    async leave() {
        await this.core.leave();
    }

    /**
     * Handle joined event
     */
    onJoined(data) {
        // Voice chat state managed by video player OSD
        console.log('[VoiceChatUI] User joined voice chat');
    }

    /**
     * Handle left event
     */
    onLeft() {
        // Voice chat state managed by video player OSD
        console.log('[VoiceChatUI] User left voice chat');
    }

    /**
     * Handle user joined
     */
    onUserJoined(data) {
        // Participant changes managed by video player OSD
    }

    /**
     * Handle user left
     */
    onUserLeft(data) {
        // Participant changes managed by video player OSD
    }

    /**
     * Handle mute changed
     */
    onMuteChanged(data) {
        // Mute state changes managed by video player OSD
    }

    /**
     * Handle local mute changed
     */
    onLocalMuteChanged(data) {
        // Local mute state managed by video player OSD
    }

    /**
     * Destroy the UI
     */
    destroy() {
        // No UI elements to clean up - everything is in video player OSD
        console.log('[VoiceChatUI] Destroyed');
    }
}

export default VoiceChatUI;
