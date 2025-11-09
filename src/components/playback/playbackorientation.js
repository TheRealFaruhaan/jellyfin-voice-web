import { playbackManager } from './playbackmanager';
import layoutManager from '../layoutManager';
import Events from '../../utils/events.ts';
import Screenfull from 'screenfull';

let orientationLocked;

function lockToLandscape() {
    if (!layoutManager.mobile) {
        return;
    }

    const lockOrientation = window.screen.lockOrientation ||
                           window.screen.mozLockOrientation ||
                           window.screen.msLockOrientation ||
                           (window.screen.orientation?.lock);

    if (lockOrientation) {
        try {
            const promise = lockOrientation('landscape');
            if (promise && promise.then) {
                promise.then(onOrientationChangeSuccess, onOrientationChangeError);
            } else {
                // returns a boolean
                orientationLocked = promise;
            }
        } catch (err) {
            onOrientationChangeError(err);
        }
    }
}

function unlockOrientation() {
    if (!orientationLocked) {
        return;
    }

    const unlock = window.screen.unlockOrientation ||
                   window.screen.mozUnlockOrientation ||
                   window.screen.msUnlockOrientation ||
                   (window.screen.orientation?.unlock);

    if (unlock) {
        try {
            unlock();
            orientationLocked = false;
        } catch (err) {
            console.error('error unlocking orientation: ' + err);
        }
    }
}

function onOrientationChangeSuccess() {
    orientationLocked = true;
}

function onOrientationChangeError(err) {
    orientationLocked = false;
    console.error('error locking orientation: ' + err);
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
