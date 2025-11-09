import { playbackManager } from './playbackmanager';
import Events from '../../utils/events.ts';
import Screenfull from 'screenfull';

let orientationLocked = false;

async function lockToLandscape() {
    // Try modern Screen Orientation API first
    if (screen.orientation && screen.orientation.lock) {
        try {
            await screen.orientation.lock('landscape');
            orientationLocked = true;
            console.debug('Screen orientation locked to landscape');
            return;
        } catch (err) {
            console.debug('Screen orientation lock failed (may require fullscreen):', err.message);
            // Continue to try legacy APIs
        }
    }

    // Fallback to legacy APIs for older browsers
    const lockOrientation = window.screen.lockOrientation ||
                           window.screen.mozLockOrientation ||
                           window.screen.msLockOrientation;

    if (lockOrientation) {
        try {
            const result = lockOrientation('landscape');
            if (result && result.then) {
                result.then(() => {
                    orientationLocked = true;
                    console.debug('Screen orientation locked to landscape (legacy API)');
                }, (err) => {
                    console.debug('Legacy orientation lock failed:', err);
                });
            } else {
                orientationLocked = !!result;
            }
        } catch (err) {
            console.debug('Legacy orientation lock error:', err);
        }
    }
}

async function unlockOrientation() {
    if (!orientationLocked) {
        return;
    }

    // Try modern Screen Orientation API first
    if (screen.orientation && screen.orientation.unlock) {
        try {
            screen.orientation.unlock();
            orientationLocked = false;
            console.debug('Screen orientation unlocked');
            return;
        } catch (err) {
            console.debug('Screen orientation unlock failed:', err.message);
        }
    }

    // Fallback to legacy APIs
    const unlock = window.screen.unlockOrientation ||
                   window.screen.mozUnlockOrientation ||
                   window.screen.msUnlockOrientation;

    if (unlock) {
        try {
            unlock();
            orientationLocked = false;
        } catch (err) {
            console.debug('Legacy orientation unlock error:', err);
        }
    }
}

Events.on(playbackManager, 'playbackstart', function (e, player) {
    const isLocalVideo = player.isLocalPlayer && !player.isExternalPlayer && playbackManager.isPlayingVideo(player);

    if (isLocalVideo) {
        lockToLandscape();
    }
});

Events.on(playbackManager, 'playbackstop', function (e, playbackStopInfo) {
    if (!playbackStopInfo.nextMediaType) {
        unlockOrientation();
    }
});

// Lock orientation to landscape when entering fullscreen
if (Screenfull.isEnabled) {
    Screenfull.on('change', () => {
        if (Screenfull.isFullscreen) {
            // Entering fullscreen
            lockToLandscape();
        } else {
            // Exiting fullscreen - only unlock if playback has stopped
            if (!playbackManager.isPlaying()) {
                unlockOrientation();
            }
        }
    });
}
