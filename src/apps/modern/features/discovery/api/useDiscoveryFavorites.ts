import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from 'apps/dashboard/features/downloads/api/authenticatedFetch';

export interface DiscoveryFavorite {
    Id: string;
    UserId: string;
    TmdbId: number;
    MediaType: string;
    Title?: string;
    PosterPath?: string;
    Year?: number;
    FavoritedAt: string;
}

const FAVORITES_QUERY_KEY = 'discovery-favorites';

export const useDiscoveryFavorites = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [FAVORITES_QUERY_KEY],
        queryFn: ({ signal }) =>
            authenticatedGet<DiscoveryFavorite[]>(
                api!,
                '/Discovery/Favorites',
                { signal }
            ),
        enabled: !!api
    });
};

export const useAddFavorite = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            tmdbId: number;
            mediaType: 'movie' | 'tvshow';
            title?: string;
            posterPath?: string;
            year?: number;
        }) => {
            const queryParams = new URLSearchParams({
                tmdbId: params.tmdbId.toString(),
                mediaType: params.mediaType
            });

            if (params.title) queryParams.append('title', params.title);
            if (params.posterPath) queryParams.append('posterPath', params.posterPath);
            if (params.year) queryParams.append('year', params.year.toString());

            await authenticatedPost<void>(
                api!,
                `/Discovery/Favorites?${queryParams.toString()}`
            );
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [FAVORITES_QUERY_KEY] });
            // Also invalidate discovery queries to update isFavorite on cards
            void queryClient.invalidateQueries({ queryKey: ['discovery'] });
        }
    });
};

export const useRemoveFavorite = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            tmdbId: number;
            mediaType: 'movie' | 'tvshow';
        }) => {
            const queryParams = new URLSearchParams({
                tmdbId: params.tmdbId.toString(),
                mediaType: params.mediaType
            });

            await authenticatedDelete<void>(
                api!,
                `/Discovery/Favorites?${queryParams.toString()}`
            );
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [FAVORITES_QUERY_KEY] });
            // Also invalidate discovery queries to update isFavorite on cards
            void queryClient.invalidateQueries({ queryKey: ['discovery'] });
        }
    });
};
