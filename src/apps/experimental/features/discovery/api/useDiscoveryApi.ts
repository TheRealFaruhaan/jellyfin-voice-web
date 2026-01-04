import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { authenticatedGet } from 'apps/dashboard/features/downloads/api/authenticatedFetch';
import type {
    DiscoveryMovie,
    DiscoveryTvShow,
    DiscoverySeason,
    DiscoveryPagedResult,
    DiskSpaceInfo,
    TorrentSearchResult
} from '../types';

// Query key factory for discovery
export const discoveryKeys = {
    all: ['discovery'] as const,
    movies: () => [...discoveryKeys.all, 'movies'] as const,
    trendingMovies: (page: number) => [...discoveryKeys.movies(), 'trending', page] as const,
    popularMovies: (page: number) => [...discoveryKeys.movies(), 'popular', page] as const,
    searchMovies: (query: string, year?: number, page?: number) =>
        [...discoveryKeys.movies(), 'search', query, year, page] as const,
    movieDetails: (tmdbId: number) => [...discoveryKeys.movies(), 'details', tmdbId] as const,
    movieTorrents: (tmdbId: number) => [...discoveryKeys.movies(), 'torrents', tmdbId] as const,
    tvShows: () => [...discoveryKeys.all, 'tvshows'] as const,
    trendingTvShows: (page: number) => [...discoveryKeys.tvShows(), 'trending', page] as const,
    popularTvShows: (page: number) => [...discoveryKeys.tvShows(), 'popular', page] as const,
    searchTvShows: (query: string, year?: number, page?: number) =>
        [...discoveryKeys.tvShows(), 'search', query, year, page] as const,
    tvShowDetails: (tmdbId: number) => [...discoveryKeys.tvShows(), 'details', tmdbId] as const,
    seasonDetails: (tmdbId: number, seasonNumber: number) =>
        [...discoveryKeys.tvShows(), 'season', tmdbId, seasonNumber] as const,
    seasonTorrents: (tmdbId: number, seasonNumber: number) =>
        [...discoveryKeys.tvShows(), 'season-torrents', tmdbId, seasonNumber] as const,
    episodeTorrents: (tmdbId: number, seasonNumber: number, episodeNumber: number) =>
        [...discoveryKeys.tvShows(), 'episode-torrents', tmdbId, seasonNumber, episodeNumber] as const,
    diskSpace: (category: 'movies' | 'tvshows') => [...discoveryKeys.all, 'diskspace', category] as const,
    customSearch: (query: string, category: string) => [...discoveryKeys.all, 'custom-search', query, category] as const
};

/**
 * Hook to get trending movies.
 */
export const useTrendingMovies = (page: number = 1) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.trendingMovies(page),
        queryFn: async () => {
            return authenticatedGet<DiscoveryPagedResult<DiscoveryMovie>>(
                api!,
                `/Discovery/Movies/Trending?page=${page}`
            );
        },
        enabled: !!api
    });
};

/**
 * Hook to get popular movies.
 */
export const usePopularMovies = (page: number = 1) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.popularMovies(page),
        queryFn: async () => {
            return authenticatedGet<DiscoveryPagedResult<DiscoveryMovie>>(
                api!,
                `/Discovery/Movies/Popular?page=${page}`
            );
        },
        enabled: !!api
    });
};

/**
 * Hook to search movies.
 */
export const useSearchMovies = (query: string, year?: number, page: number = 1) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.searchMovies(query, year, page),
        queryFn: async () => {
            let url = `/Discovery/Movies/Search?query=${encodeURIComponent(query)}&page=${page}`;
            if (year) {
                url += `&year=${year}`;
            }
            return authenticatedGet<DiscoveryPagedResult<DiscoveryMovie>>(api!, url);
        },
        enabled: !!api && query.length >= 2
    });
};

/**
 * Hook to get movie details.
 */
export const useMovieDetails = (tmdbId: number, enabled: boolean = true) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.movieDetails(tmdbId),
        queryFn: async () => {
            return authenticatedGet<DiscoveryMovie>(
                api!,
                `/Discovery/Movies/${tmdbId}`
            );
        },
        enabled: !!api && enabled && tmdbId > 0
    });
};

/**
 * Hook to search torrents for a movie.
 */
export const useMovieTorrents = (tmdbId: number, enabled: boolean = true) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.movieTorrents(tmdbId),
        queryFn: async () => {
            return authenticatedGet<TorrentSearchResult[]>(
                api!,
                `/Discovery/Movies/${tmdbId}/Torrents`
            );
        },
        enabled: !!api && enabled && tmdbId > 0
    });
};

/**
 * Hook to get trending TV shows.
 */
export const useTrendingTvShows = (page: number = 1) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.trendingTvShows(page),
        queryFn: async () => {
            return authenticatedGet<DiscoveryPagedResult<DiscoveryTvShow>>(
                api!,
                `/Discovery/TvShows/Trending?page=${page}`
            );
        },
        enabled: !!api
    });
};

/**
 * Hook to get popular TV shows.
 */
export const usePopularTvShows = (page: number = 1) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.popularTvShows(page),
        queryFn: async () => {
            return authenticatedGet<DiscoveryPagedResult<DiscoveryTvShow>>(
                api!,
                `/Discovery/TvShows/Popular?page=${page}`
            );
        },
        enabled: !!api
    });
};

/**
 * Hook to search TV shows.
 */
export const useSearchTvShows = (query: string, year?: number, page: number = 1) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.searchTvShows(query, year, page),
        queryFn: async () => {
            let url = `/Discovery/TvShows/Search?query=${encodeURIComponent(query)}&page=${page}`;
            if (year) {
                url += `&year=${year}`;
            }
            return authenticatedGet<DiscoveryPagedResult<DiscoveryTvShow>>(api!, url);
        },
        enabled: !!api && query.length >= 2
    });
};

/**
 * Hook to get TV show details.
 */
export const useTvShowDetails = (tmdbId: number, enabled: boolean = true) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.tvShowDetails(tmdbId),
        queryFn: async () => {
            return authenticatedGet<DiscoveryTvShow>(
                api!,
                `/Discovery/TvShows/${tmdbId}`
            );
        },
        enabled: !!api && enabled && tmdbId > 0
    });
};

/**
 * Hook to get season details with episodes.
 */
export const useSeasonDetails = (tmdbId: number, seasonNumber: number, enabled: boolean = true) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.seasonDetails(tmdbId, seasonNumber),
        queryFn: async () => {
            return authenticatedGet<DiscoverySeason>(
                api!,
                `/Discovery/TvShows/${tmdbId}/Seasons/${seasonNumber}`
            );
        },
        enabled: !!api && enabled && tmdbId > 0 && seasonNumber >= 0
    });
};

/**
 * Hook to search torrents for a season.
 */
export const useSeasonTorrents = (tmdbId: number, seasonNumber: number, enabled: boolean = true) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.seasonTorrents(tmdbId, seasonNumber),
        queryFn: async () => {
            return authenticatedGet<TorrentSearchResult[]>(
                api!,
                `/Discovery/TvShows/${tmdbId}/Seasons/${seasonNumber}/Torrents`
            );
        },
        enabled: !!api && enabled && tmdbId > 0 && seasonNumber >= 0
    });
};

/**
 * Hook to search torrents for an episode.
 */
export const useEpisodeTorrents = (
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    enabled: boolean = true
) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.episodeTorrents(tmdbId, seasonNumber, episodeNumber),
        queryFn: async () => {
            return authenticatedGet<TorrentSearchResult[]>(
                api!,
                `/Discovery/TvShows/${tmdbId}/Seasons/${seasonNumber}/Episodes/${episodeNumber}/Torrents`
            );
        },
        enabled: !!api && enabled && tmdbId > 0 && seasonNumber >= 0 && episodeNumber > 0
    });
};

/**
 * Hook to get disk space info.
 */
export const useDiskSpace = (category: 'movies' | 'tvshows') => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.diskSpace(category),
        queryFn: async () => {
            return authenticatedGet<DiskSpaceInfo>(
                api!,
                `/Discovery/DiskSpace/${category}`
            );
        },
        enabled: !!api
    });
};

/**
 * Hook to perform custom torrent search.
 */
export const useCustomTorrentSearch = (query: string, category: 'movie' | 'tv', enabled: boolean = true) => {
    const { api } = useApi();

    return useQuery({
        queryKey: discoveryKeys.customSearch(query, category),
        queryFn: async () => {
            return authenticatedGet<TorrentSearchResult[]>(
                api!,
                `/Discovery/Search/Custom?query=${encodeURIComponent(query)}&category=${category}`
            );
        },
        enabled: !!api && enabled && query.length >= 2
    });
};
