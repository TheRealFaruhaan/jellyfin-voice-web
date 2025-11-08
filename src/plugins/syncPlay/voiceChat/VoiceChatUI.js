/**
 * Voice Chat UI Component
 * Provides UI controls for voice chat in SyncPlay
 */

import Events from '../../../utils/events.ts';

class VoiceChatUI {
    constructor(voiceChatCore) {
        this.core = voiceChatCore;
        this.container = null;
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
     * @param {HTMLElement} parentElement - Parent element to attach UI to
     */
    create(parentElement) {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'voicechat-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 15px;
            min-width: 250px;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            display: none;
        `;

        // Create header
        const header = document.createElement('div');
        header.className = 'voicechat-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        `;
        const title = document.createElement('h3');
        title.textContent = 'Voice Chat';
        title.style.cssText = 'margin: 0; font-size: 16px; font-weight: bold;';
        header.appendChild(title);

        // Create controls
        const controls = document.createElement('div');
        controls.className = 'voicechat-controls';
        controls.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        `;

        // Mute button
        this.muteButton = this.createButton('🎤 Unmuted', () => this.toggleMute());
        this.muteButton.style.flex = '1';
        controls.appendChild(this.muteButton);

        // Leave button
        this.leaveButton = this.createButton('Leave', () => this.leave());
        this.leaveButton.style.cssText += 'background: #d32f2f; flex: 1;';
        controls.appendChild(this.leaveButton);

        // Create participants list
        this.participantsList = document.createElement('div');
        this.participantsList.className = 'voicechat-participants';
        this.participantsList.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
        `;

        const participantsHeader = document.createElement('div');
        participantsHeader.textContent = 'Participants';
        participantsHeader.style.cssText = `
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
        `;

        // Assemble UI
        this.container.appendChild(header);
        this.container.appendChild(controls);
        this.container.appendChild(participantsHeader);
        this.container.appendChild(this.participantsList);

        parentElement.appendChild(this.container);
    }

    /**
     * Create a button element
     * @param {string} text - Button text
     * @param {Function} onClick - Click handler
     * @returns {HTMLElement}
     */
    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            background: #00a4dc;
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        `;
        button.onmouseover = () => button.style.background = '#0080b0';
        button.onmouseout = () => button.style.background = '#00a4dc';
        button.onclick = onClick;
        return button;
    }

    /**
     * Show the UI
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * Hide the UI
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Update participants list
     */
    updateParticipants() {
        if (!this.participantsList) return;

        this.participantsList.innerHTML = '';
        const participants = this.core.getState().participants;

        participants.forEach(participant => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 8px;
                margin-bottom: 5px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const name = document.createElement('span');
            name.textContent = participant.UserName;
            name.style.cssText = 'font-size: 14px;';

            const status = document.createElement('span');
            status.textContent = participant.IsMuted ? '🔇' : '🔊';
            status.style.cssText = 'font-size: 16px;';

            item.appendChild(name);
            item.appendChild(status);
            this.participantsList.appendChild(item);
        });
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
        this.show();
        this.updateParticipants();
    }

    /**
     * Handle left event
     */
    onLeft() {
        this.hide();
        if (this.participantsList) {
            this.participantsList.innerHTML = '';
        }
    }

    /**
     * Handle user joined
     */
    onUserJoined(data) {
        this.updateParticipants();
    }

    /**
     * Handle user left
     */
    onUserLeft(data) {
        this.updateParticipants();
    }

    /**
     * Handle mute changed
     */
    onMuteChanged(data) {
        this.updateParticipants();
    }

    /**
     * Handle local mute changed
     */
    onLocalMuteChanged(data) {
        if (this.muteButton) {
            this.muteButton.textContent = data.isMuted ? '🔇 Muted' : '🎤 Unmuted';
            this.muteButton.style.background = data.isMuted ? '#d32f2f' : '#00a4dc';
        }
    }

    /**
     * Destroy the UI
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.muteButton = null;
        this.leaveButton = null;
        this.participantsList = null;
    }
}

export default VoiceChatUI;
