import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { StartEpisodeDownloadRequest, StartMovieDownloadRequest, TorrentDownload } from '../types';
import { QUERY_KEY as DOWNLOADS_KEY } from './useDownloads';
import { QUERY_KEY as MISSING_KEY } from './useMissingEpisodes';

export const useStartEpisodeDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: StartEpisodeDownloadRequest): Promise<TorrentDownload> => {
            const response = await api!.axiosInstance.post<TorrentDownload>(
                '/MediaAcquisition/Downloads/Episode',
                request
            );
            return response.data;
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
            const response = await api!.axiosInstance.post<TorrentDownload>(
                '/MediaAcquisition/Downloads/Movie',
                request
            );
            return response.data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [DOWNLOADS_KEY] });
        }
    });
};
