import SyncPlaySettingsEditor from './settings/SettingsEditor';
import loading from '../../../components/loading/loading';
import toast from '../../../components/toast/toast';
import actionsheet from '../../../components/actionSheet/actionSheet';
import globalize from '../../../lib/globalize';
import playbackPermissionManager from './playbackPermissionManager';
import { pluginManager } from '../../../components/pluginManager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from '../../../types/plugin.ts';
import Events from '../../../utils/events.ts';

import './groupSelectionMenu.scss';

/**
 * Class that manages the SyncPlay group selection menu.
 */
class GroupSelectionMenu {
    constructor() {
        // Register to SyncPlay events.
        this.syncPlayEnabled = false;
        this.SyncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;

        if (this.SyncPlay) {
            Events.on(this.SyncPlay.Manager, 'enabled', (_event, enabled) => {
                this.syncPlayEnabled = enabled;
            });
        }

        Events.on(pluginManager, 'registered', (_event0, plugin) => {
            if (plugin.type === PluginType.SyncPlay) {
                this.SyncPlay = plugin.instance;

                Events.on(plugin.instance.Manager, 'enabled', (_event1, enabled) => {
                    this.syncPlayEnabled = enabled;
                });
            }
        });
    }

    /**
     * Used when user needs to join a group.
     * @param {HTMLElement} button - Element where to place the menu.
     * @param {Object} user - Current user.
     * @param {Object} apiClient - ApiClient.
     */
    showNewJoinGroupSelection(button, user, apiClient) {
        const policy = user.localUser ? user.localUser.Policy : {};

        apiClient.getSyncPlayGroups().then(function (response) {
            response.json().then(function (groups) {
                const menuItems = groups.map(function (group) {
                    return {
                        name: group.GroupName,
                        icon: 'person',
                        id: group.GroupId,
                        selected: false,
                        secondaryText: group.Participants.join(', ')
                    };
                });

                if (policy.SyncPlayAccess === 'CreateAndJoinGroups') {
                    menuItems.push({
                        name: globalize.translate('LabelSyncPlayNewGroup'),
                        icon: 'add',
                        id: 'new-group',
                        selected: true,
                        secondaryText: globalize.translate('LabelSyncPlayNewGroupDescription')
                    });
                }

                if (menuItems.length === 0 && policy.SyncPlayAccess === 'JoinGroups') {
                    toast({
                        text: globalize.translate('MessageSyncPlayCreateGroupDenied')
                    });
                    loading.hide();
                    return;
                }

                const menuOptions = {
                    title: globalize.translate('HeaderSyncPlaySelectGroup'),
                    items: menuItems,
                    positionTo: button,
                    border: true,
                    dialogClass: 'syncPlayGroupMenu'
                };

                actionsheet.show(menuOptions).then(function (id) {
                    if (id == 'new-group') {
                        apiClient.createSyncPlayGroup({
                            GroupName: globalize.translate('SyncPlayGroupDefaultTitle', user.localUser.Name)
                        });
                    } else if (id) {
                        apiClient.joinSyncPlayGroup({
                            GroupId: id
                        });
                    }
                }).catch((error) => {
                    if (error) {
                        console.error('SyncPlay: unexpected error listing groups:', error);
                    }
                });

                loading.hide();
            });
        }).catch(function (error) {
            console.error(error);
            loading.hide();
            toast({
                text: globalize.translate('MessageSyncPlayErrorAccessingGroups')
            });
        });
    }

    /**
     * Gets voice chat status and participant info for display.
     * @returns {Object} Voice chat info including icon, status text, and participant count.
     */
    getVoiceChatInfo() {
        const voiceChatCore = this.SyncPlay?.Manager.voiceChatCore;
        if (!voiceChatCore) {
            return { icon: 'mic', text: 'Not available', participants: 0 };
        }

        const isJoined = voiceChatCore.isActive;
        const isMuted = voiceChatCore.isMuted;
        const participants = voiceChatCore.participants?.length || 0;

        let icon = 'mic';
        let text = 'Join Voice Chat';

        if (isJoined) {
            icon = isMuted ? 'mic_off' : 'mic';
            text = isMuted ? 'Voice Chat (Muted)' : 'Voice Chat (Active)';
        } else if (participants > 0) {
            text = `Join Voice Chat (${participants} in call)`;
        }

        return { icon, text, participants, isJoined, isMuted };
    }

    /**
     * Used when user has joined a group.
     * @param {HTMLElement} button - Element where to place the menu.
     * @param {Object} user - Current user.
     * @param {Object} apiClient - ApiClient.
     */
    showLeaveGroupSelection(button, user, apiClient) {
        const groupInfo = this.SyncPlay?.Manager.getGroupInfo();

        if (!groupInfo) {
            console.error('GroupInfo is null when trying to show leave group menu');
            loading.hide();
            toast({
                text: globalize.translate('MessageSyncPlayNoGroupsAvailable')
            });
            return;
        }

        const menuItems = [];

        if (!this.SyncPlay?.Manager.isPlaylistEmpty()
            && !this.SyncPlay?.Manager.isPlaybackActive()) {
            menuItems.push({
                name: globalize.translate('LabelSyncPlayResumePlayback'),
                icon: 'play_circle_filled',
                id: 'resume-playback',
                selected: false,
                secondaryText: globalize.translate('LabelSyncPlayResumePlaybackDescription')
            });
        } else if (this.SyncPlay?.Manager.isPlaybackActive()) {
            menuItems.push({
                name: globalize.translate('LabelSyncPlayHaltPlayback'),
                icon: 'pause_circle_filled',
                id: 'halt-playback',
                selected: false,
                secondaryText: globalize.translate('LabelSyncPlayHaltPlaybackDescription')
            });
        }

        // Add Voice Chat menu item
        const voiceInfo = this.getVoiceChatInfo();
        menuItems.push({
            name: voiceInfo.text,
            icon: voiceInfo.icon,
            id: 'voice-chat',
            selected: false,
            secondaryText: voiceInfo.isJoined
                ? 'Click to toggle mute or leave voice chat'
                : 'Join the group voice chat'
        });

        menuItems.push({
            name: globalize.translate('Settings'),
            icon: 'video_settings',
            id: 'settings',
            selected: false,
            secondaryText: globalize.translate('LabelSyncPlaySettingsDescription')
        });

        menuItems.push({
            name: globalize.translate('LabelSyncPlayLeaveGroup'),
            icon: 'meeting_room',
            id: 'leave-group',
            selected: true,
            secondaryText: globalize.translate('LabelSyncPlayLeaveGroupDescription')
        });

        const menuOptions = {
            title: groupInfo.GroupName,
            text: groupInfo.Participants.join(', '),
            dialogClass: 'syncPlayGroupMenu',
            items: menuItems,
            positionTo: button,
            border: true
        };

        actionsheet.show(menuOptions).then((id) => {
            if (id == 'resume-playback') {
                this.SyncPlay?.Manager.resumeGroupPlayback(apiClient);
            } else if (id == 'halt-playback') {
                this.SyncPlay?.Manager.haltGroupPlayback(apiClient);
            } else if (id == 'voice-chat') {
                this.handleVoiceChatAction();
            } else if (id == 'leave-group') {
                apiClient.leaveSyncPlayGroup();
            } else if (id == 'settings') {
                new SyncPlaySettingsEditor(apiClient, this.SyncPlay?.Manager.getTimeSyncCore(), { groupInfo: groupInfo })
                    .embed()
                    .catch(error => {
                        if (error) {
                            console.error('Error creating SyncPlay settings editor', error);
                        }
                    });
            }
        }).catch((error) => {
            if (error) {
                console.error('SyncPlay: unexpected error showing group menu:', error);
            }
        });

        loading.hide();
    }

    /**
     * Handles voice chat menu item click.
     */
    handleVoiceChatAction() {
        const voiceChatCore = this.SyncPlay?.Manager.voiceChatCore;
        if (!voiceChatCore) {
            toast({
                text: 'Voice chat is not available'
            });
            return;
        }

        if (voiceChatCore.isActive) {
            // Show sub-menu for mute/leave options
            this.showVoiceChatOptions();
        } else {
            // Join voice chat
            this.SyncPlay?.Manager.joinVoiceChat();
        }
    }

    /**
     * Shows voice chat options when already in voice.
     */
    showVoiceChatOptions() {
        const voiceChatCore = this.SyncPlay?.Manager.voiceChatCore;
        const isMuted = voiceChatCore.isMuted;

        const menuItems = [
            {
                name: isMuted ? 'Unmute Microphone' : 'Mute Microphone',
                icon: isMuted ? 'mic' : 'mic_off',
                id: 'toggle-mute',
                selected: false,
                secondaryText: isMuted ? 'Turn your microphone on' : 'Turn your microphone off'
            },
            {
                name: 'Volume Settings',
                icon: 'tune',
                id: 'volume-settings',
                selected: false,
                secondaryText: 'Adjust media and voice chat volume'
            },
            {
                name: 'Leave Voice Chat',
                icon: 'call_end',
                id: 'leave-voice',
                selected: true,
                secondaryText: 'Disconnect from voice chat'
            }
        ];

        const menuOptions = {
            title: 'Voice Chat',
            items: menuItems
        };

        actionsheet.show(menuOptions).then((id) => {
            if (id == 'toggle-mute') {
                voiceChatCore.toggleMute();
            } else if (id == 'volume-settings') {
                this.showVolumeSettings();
            } else if (id == 'leave-voice') {
                this.SyncPlay?.Manager.leaveVoiceChat();
            }
        }).catch((error) => {
            if (error) {
                console.error('SyncPlay: unexpected error showing voice chat menu:', error);
            }
        });
    }

    /**
     * Shows volume settings dialog for voice chat.
     */
    showVolumeSettings() {
        const voiceChatCore = this.SyncPlay?.Manager.voiceChatCore;
        if (!voiceChatCore) return;

        const mediaVolume = Math.round(voiceChatCore.getMediaVolume() * 100);
        const voiceVolume = Math.round(voiceChatCore.getVoiceChatVolume() * 100);

        // Create volume control dialog
        const dialogContent = `
            <div style="padding: 1em; min-width: 280px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;">
                    <h3 style="margin: 0;">Voice Chat Volume</h3>
                    <button id="btnCloseVolumeSettings" is="paper-icon-button-light" class="autoSize" title="Close" style="margin: -0.5em -0.5em -0.5em 0;">
                        <span class="material-icons" aria-hidden="true">close</span>
                    </button>
                </div>
                <div style="margin-bottom: 1.5em;">
                    <label style="display: flex; align-items: center; margin-bottom: 0.5em;">
                        <span class="material-icons" style="margin-right: 0.5em;">movie</span>
                        <span>Media Volume</span>
                    </label>
                    <div style="display: flex; align-items: center;">
                        <input type="range" id="voiceChatMediaVolume" min="0" max="100" value="${mediaVolume}" style="flex: 1; margin-right: 0.5em;" />
                        <span id="voiceChatMediaVolumeValue" style="min-width: 3em; text-align: right;">${mediaVolume}%</span>
                    </div>
                </div>
                <div style="margin-bottom: 1.5em;">
                    <label style="display: flex; align-items: center; margin-bottom: 0.5em;">
                        <span class="material-icons" style="margin-right: 0.5em;">mic</span>
                        <span>Voice Chat Volume</span>
                    </label>
                    <div style="display: flex; align-items: center;">
                        <input type="range" id="voiceChatVoiceVolume" min="0" max="100" value="${voiceVolume}" style="flex: 1; margin-right: 0.5em;" />
                        <span id="voiceChatVoiceVolumeValue" style="min-width: 3em; text-align: right;">${voiceVolume}%</span>
                    </div>
                </div>
            </div>
        `;

        import('../../../components/dialogHelper/dialogHelper').then(({ default: dialogHelper }) => {
            const dlg = dialogHelper.createDialog({
                removeOnClose: true,
                size: 'small'
            });

            dlg.innerHTML = dialogContent;
            dlg.classList.add('dialog');

            const mediaVolumeSlider = dlg.querySelector('#voiceChatMediaVolume');
            const mediaVolumeValue = dlg.querySelector('#voiceChatMediaVolumeValue');
            const voiceVolumeSlider = dlg.querySelector('#voiceChatVoiceVolume');
            const voiceVolumeValue = dlg.querySelector('#voiceChatVoiceVolumeValue');
            const btnClose = dlg.querySelector('#btnCloseVolumeSettings');

            mediaVolumeSlider.addEventListener('input', function () {
                const value = parseInt(this.value, 10);
                mediaVolumeValue.textContent = value + '%';
                voiceChatCore.setMediaVolume(value / 100);
            });

            voiceVolumeSlider.addEventListener('input', function () {
                const value = parseInt(this.value, 10);
                voiceVolumeValue.textContent = value + '%';
                voiceChatCore.setVoiceChatVolume(value / 100);
            });

            btnClose.addEventListener('click', function () {
                dialogHelper.close(dlg);
            });

            dialogHelper.open(dlg);
        });
    }

    /**
     * Shows a menu to handle SyncPlay groups.
     * @param {HTMLElement} button - Element where to place the menu.
     */
    show(button) {
        loading.show();

        // TODO: should feature be disabled if playback permission is missing?
        playbackPermissionManager.check().then(() => {
            console.debug('Playback is allowed.');
        }).catch((error) => {
            console.error('Playback not allowed!', error);
            toast({
                text: globalize.translate('MessageSyncPlayPlaybackPermissionRequired')
            });
        });

        const apiClient = ServerConnections.currentApiClient();
        ServerConnections.user(apiClient).then((user) => {
            // Check both the flag and the actual Manager state to handle race conditions
            const isEnabled = this.syncPlayEnabled || (this.SyncPlay?.Manager.isSyncPlayEnabled() ?? false);

            if (isEnabled) {
                this.showLeaveGroupSelection(button, user, apiClient);
            } else {
                this.showNewJoinGroupSelection(button, user, apiClient);
            }
        }).catch((error) => {
            console.error(error);
            loading.hide();
            toast({
                text: globalize.translate('MessageSyncPlayNoGroupsAvailable')
            });
        });
    }
}

/** GroupSelectionMenu singleton. */
const groupSelectionMenu = new GroupSelectionMenu();
export default groupSelectionMenu;
