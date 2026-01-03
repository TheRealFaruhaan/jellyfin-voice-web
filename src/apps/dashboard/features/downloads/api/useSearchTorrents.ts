import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { SearchEpisodeRequest, SearchMovieRequest, TorrentSearchResult } from '../types';
import { authenticatedPost } from './authenticatedFetch';

export const useSearchEpisodeTorrents = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (request: SearchEpisodeRequest): Promise<TorrentSearchResult[]> => {
            return authenticatedPost<TorrentSearchResult[]>(
                api!,
                '/MediaAcquisition/Search/Episode',
                request
            );
        }
    });
};

export const useSearchMovieTorrents = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (request: SearchMovieRequest): Promise<TorrentSearchResult[]> => {
            return authenticatedPost<TorrentSearchResult[]>(
                api!,
                '/MediaAcquisition/Search/Movie',
                request
            );
        }
    });
};
