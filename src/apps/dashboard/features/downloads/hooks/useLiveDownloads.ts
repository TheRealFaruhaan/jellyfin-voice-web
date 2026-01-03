import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import Events, { type Event } from 'utils/events';
import serverNotifications from 'scripts/serverNotifications';
import type { TorrentDownload } from '../types';
import { QUERY_KEY } from '../api/useDownloads';

/**
 * Hook that subscribes to WebSocket updates for download progress.
 * Updates the React Query cache when progress updates are received.
 */
export const useLiveDownloads = () => {
    const { __legacyApiClient__ } = useApi();
    const queryClient = useQueryClient();

    const handleProgressUpdate = useCallback(
        (_evt: Event, _apiClient: unknown, data: TorrentDownload) => {
            // Update the specific download in the cache
            queryClient.setQueryData<TorrentDownload[]>([QUERY_KEY], (oldData) => {
                if (!oldData) return oldData;

                const index = oldData.findIndex((d) => d.id === data.id);
                if (index === -1) {
                    // New download, add to the beginning
                    return [data, ...oldData];
                }

                // Update existing download
                const newData = [...oldData];
                newData[index] = data;
                return newData;
            });

            // Also update the active downloads cache
            queryClient.setQueryData<TorrentDownload[]>([QUERY_KEY, 'active'], (oldData) => {
                if (!oldData) return oldData;

                const isActive = ['Queued', 'Downloading', 'Paused', 'Seeding'].includes(data.state);
                const index = oldData.findIndex((d) => d.id === data.id);

                if (isActive) {
                    if (index === -1) {
                        return [data, ...oldData];
                    }
                    const newData = [...oldData];
                    newData[index] = data;
                    return newData;
                } else {
                    // Remove from active if no longer active
                    if (index !== -1) {
                        return oldData.filter((d) => d.id !== data.id);
                    }
                    return oldData;
                }
            });
        },
        [queryClient]
    );

    useEffect(() => {
        if (!__legacyApiClient__) return;

        // Subscribe to torrent progress updates
        // The message type corresponds to what we send from TorrentProgressEventEmitter
        Events.on(serverNotifications, 'RefreshProgress', handleProgressUpdate);

        return () => {
            Events.off(serverNotifications, 'RefreshProgress', handleProgressUpdate);
        };
    }, [__legacyApiClient__, handleProgressUpdate]);
};

export default useLiveDownloads;
