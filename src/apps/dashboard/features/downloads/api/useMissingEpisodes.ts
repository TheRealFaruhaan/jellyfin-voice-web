import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { MissingEpisodeInfo } from '../types';

export const QUERY_KEY = 'MissingEpisodes';

export const useMissingEpisodes = (seriesId: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, seriesId],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<MissingEpisodeInfo[]>(
                `/MediaAcquisition/Missing/Episodes/${seriesId}`,
                { signal }
            );
            return response.data;
        },
        enabled: !!api && !!seriesId
    });
};

export const useMissingEpisodesForSeason = (seriesId: string, seasonNumber: number) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, seriesId, seasonNumber],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<MissingEpisodeInfo[]>(
                `/MediaAcquisition/Missing/Episodes/${seriesId}/Season/${seasonNumber}`,
                { signal }
            );
            return response.data;
        },
        enabled: !!api && !!seriesId && seasonNumber >= 0
    });
};

export const useAllMissingEpisodes = (limit = 100) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, 'all', limit],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<MissingEpisodeInfo[]>(
                '/MediaAcquisition/Missing/Episodes',
                { signal, params: { limit } }
            );
            return response.data;
        },
        enabled: !!api
    });
};
