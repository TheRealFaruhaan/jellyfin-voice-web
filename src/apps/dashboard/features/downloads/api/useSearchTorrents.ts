import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { SearchEpisodeRequest, SearchMovieRequest, TorrentSearchResult } from '../types';

export const useSearchEpisodeTorrents = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (request: SearchEpisodeRequest): Promise<TorrentSearchResult[]> => {
            const response = await api!.axiosInstance.post<TorrentSearchResult[]>(
                '/MediaAcquisition/Search/Episode',
                request
            );
            return response.data;
        }
    });
};

export const useSearchMovieTorrents = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (request: SearchMovieRequest): Promise<TorrentSearchResult[]> => {
            const response = await api!.axiosInstance.post<TorrentSearchResult[]>(
                '/MediaAcquisition/Search/Movie',
                request
            );
            return response.data;
        }
    });
};
