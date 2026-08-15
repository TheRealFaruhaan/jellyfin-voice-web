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
            // Ignore anything that isn't a recognisable download. Without this an
            // unexpected payload shape gets prepended as a row with no id, which
            // renders as an empty placeholder card.
            if (!data?.id) {
                console.warn('[useLiveDownloads] ignoring progress payload with no id', data);
                return;
            }

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

        // Subscribe to torrent progress updates.
        // Must not reuse 'RefreshProgress' — that is Jellyfin's own library-scan progress
        // message, whose payload has no download id and would be inserted as a bogus row.
        Events.on(serverNotifications, 'TorrentProgress', handleProgressUpdate);

        return () => {
            Events.off(serverNotifications, 'TorrentProgress', handleProgressUpdate);
        };
    }, [__legacyApiClient__, handleProgressUpdate]);
};

export default useLiveDownloads;
