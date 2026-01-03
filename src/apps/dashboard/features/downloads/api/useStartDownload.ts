import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { StartEpisodeDownloadRequest, StartMovieDownloadRequest, TorrentDownload } from '../types';
import { QUERY_KEY as DOWNLOADS_KEY } from './useDownloads';
import { QUERY_KEY as MISSING_KEY } from './useMissingEpisodes';
import { authenticatedPost } from './authenticatedFetch';

export const useStartEpisodeDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: StartEpisodeDownloadRequest): Promise<TorrentDownload> => {
            return authenticatedPost<TorrentDownload>(
                api!,
                '/MediaAcquisition/Downloads/Episode',
                request
            );
        },
        onSuccess: (_, variables) => {
            // Invalidate downloads list
            void queryClient.invalidateQueries({ queryKey: [DOWNLOADS_KEY] });
            // Invalidate missing episodes for the series
            void queryClient.invalidateQueries({ queryKey: [MISSING_KEY, variables.seriesId] });
        }
    });
};

export const useStartMovieDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: StartMovieDownloadRequest): Promise<TorrentDownload> => {
            return authenticatedPost<TorrentDownload>(
                api!,
                '/MediaAcquisition/Downloads/Movie',
                request
            );
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [DOWNLOADS_KEY] });
        }
    });
};
