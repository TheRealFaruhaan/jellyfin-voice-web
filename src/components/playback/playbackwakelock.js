import { playbackManager } from './playbackmanager';
import Events from '../../utils/events.ts';

let wakeLock = null;

/**
 * Request a screen wake lock to prevent the screen from dimming or turning off
 */
async function requestWakeLock() {
    // Check if Wake Lock API is supported
    if (!('wakeLock' in navigator)) {
        console.debug('Wake Lock API not supported');
        return;
    }

    try {
        // Release existing wake lock if any
        if (wakeLock !== null) {
            await releaseWakeLock();
        }

        wakeLock = await navigator.wakeLock.request('screen');
        console.debug('Wake Lock acquired');

        wakeLock.addEventListener('release', () => {
            console.debug('Wake Lock released');
        });
    } catch (err) {
        console.error('Failed to acquire wake lock:', err);
    }
}

/**
 * Release the screen wake lock
 */
async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
            wakeLock = null;
        } catch (err) {
            console.error('Failed to release wake lock:', err);
        }
    }
}

// Request wake lock when video playback starts
Events.on(playbackManager, 'playbackstart', function (e, player) {
    const isLocalVideo = player.isLocalPlayer && !player.isExternalPlayer && playbackManager.isPlayingVideo(player);

    if (isLocalVideo) {
        requestWakeLock();
    }
});

// Release wake lock when video playback stops
Events.on(playbackManager, 'playbackstop', function (e, playbackStopInfo) {
    if (!playbackStopInfo.nextMediaType) {
        releaseWakeLock();
    }
});

// Re-acquire wake lock when page becomes visible again
// (wake locks are automatically released when page is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && playbackManager.isPlaying() && playbackManager.isPlayingVideo()) {
        requestWakeLock();
    }
});
