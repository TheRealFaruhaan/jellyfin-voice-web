import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { MissingEpisodeInfo } from '../types';
import { authenticatedGet } from './authenticatedFetch';

export const QUERY_KEY = 'MissingEpisodes';

export const useMissingEpisodes = (seriesId: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, seriesId],
        queryFn: ({ signal }) => authenticatedGet<MissingEpisodeInfo[]>(
            api!,
            `/MediaAcquisition/Missing/Episodes/${seriesId}`,
            { signal }
        ),
        enabled: !!api && !!seriesId
    });
};

export const useMissingEpisodesForSeason = (seriesId: string, seasonNumber: number) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, seriesId, seasonNumber],
        queryFn: ({ signal }) => authenticatedGet<MissingEpisodeInfo[]>(
            api!,
            `/MediaAcquisition/Missing/Episodes/${seriesId}/Season/${seasonNumber}`,
            { signal }
        ),
        enabled: !!api && !!seriesId && seasonNumber >= 0
    });
};

export const useAllMissingEpisodes = (limit = 100) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, 'all', limit],
        queryFn: ({ signal }) => authenticatedGet<MissingEpisodeInfo[]>(
            api!,
            '/MediaAcquisition/Missing/Episodes',
            { signal, params: { limit } }
        ),
        enabled: !!api
    });
};
