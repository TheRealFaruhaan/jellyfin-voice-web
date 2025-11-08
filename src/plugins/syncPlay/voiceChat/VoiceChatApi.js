/**
 * Voice Chat API helper for SyncPlay
 */

import { ApiClient } from 'jellyfin-apiclient';

class VoiceChatApi {
    /**
     * @param {ApiClient} apiClient - The API client instance
     */
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Join voice chat for a group
     * @param {string} groupId - The group ID
     * @returns {Promise<Object>} Voice chat state
     */
    async joinVoiceChat(groupId) {
        const url = this.apiClient.getUrl(`SyncPlay/VoiceChat/Join/${groupId}`);
        return this.apiClient.fetch({
            url,
            type: 'POST',
            dataType: 'json'
        });
    }

    /**
     * Leave voice chat for a group
     * @param {string} groupId - The group ID
     * @returns {Promise<void>}
     */
    async leaveVoiceChat(groupId) {
        const url = this.apiClient.getUrl(`SyncPlay/VoiceChat/Leave/${groupId}`);
        return this.apiClient.fetch({
            url,
            type: 'POST'
        });
    }

    /**
     * Send a voice chat signal
     * @param {Object} signal - The signal object
     * @returns {Promise<void>}
     */
    async sendSignal(signal) {
        const url = this.apiClient.getUrl('SyncPlay/VoiceChat/Signal');
        return this.apiClient.fetch({
            url,
            type: 'POST',
            data: JSON.stringify(signal),
            contentType: 'application/json'
        });
    }

    /**
     * Update mute status
     * @param {string} groupId - The group ID
     * @param {boolean} isMuted - Whether the user is muted
     * @returns {Promise<void>}
     */
    async updateMuteStatus(groupId, isMuted) {
        const url = this.apiClient.getUrl(`SyncPlay/VoiceChat/Mute/${groupId}?isMuted=${isMuted}`);
        return this.apiClient.fetch({
            url,
            type: 'POST'
        });
    }

    /**
     * Get voice chat state for a group
     * @param {string} groupId - The group ID
     * @returns {Promise<Object>} Voice chat state
     */
    async getVoiceChatState(groupId) {
        const url = this.apiClient.getUrl(`SyncPlay/VoiceChat/State/${groupId}`);
        return this.apiClient.fetch({
            url,
            type: 'GET',
            dataType: 'json'
        });
    }

    /**
     * Get voice chat configuration
     * @returns {Promise<Object>} Voice chat configuration
     */
    async getConfiguration() {
        const url = this.apiClient.getUrl('SyncPlay/VoiceChat/Configuration');
        return this.apiClient.fetch({
            url,
            type: 'GET',
            dataType: 'json'
        });
    }
}

export default VoiceChatApi;
