import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { authenticatedPost } from 'apps/dashboard/features/downloads/api/authenticatedFetch';
import type {
    StartDiscoveryMovieDownloadRequest,
    StartDiscoverySeasonDownloadRequest,
    StartDiscoveryEpisodeDownloadRequest,
    TorrentSearchResult
} from '../types';
import type { TorrentDownload } from 'apps/dashboard/features/downloads/types';

/**
 * Hook to start a discovery movie download.
 */
export const useStartDiscoveryMovieDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: StartDiscoveryMovieDownloadRequest): Promise<TorrentDownload> => {
            return authenticatedPost<TorrentDownload>(
                api!,
                '/Discovery/Movies/Download',
                request
            );
        },
        onSuccess: () => {
            // Invalidate downloads list
            queryClient.invalidateQueries({ queryKey: ['downloads'] });
        }
    });
};

/**
 * Hook to start a discovery season download.
 */
export const useStartDiscoverySeasonDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: StartDiscoverySeasonDownloadRequest): Promise<TorrentDownload> => {
            return authenticatedPost<TorrentDownload>(
                api!,
                '/Discovery/TvShows/Season/Download',
                request
            );
        },
        onSuccess: () => {
            // Invalidate downloads list
            queryClient.invalidateQueries({ queryKey: ['downloads'] });
        }
    });
};

/**
 * Hook to start a discovery episode download.
 */
export const useStartDiscoveryEpisodeDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: StartDiscoveryEpisodeDownloadRequest): Promise<TorrentDownload> => {
            return authenticatedPost<TorrentDownload>(
                api!,
                '/Discovery/TvShows/Episode/Download',
                request
            );
        },
        onSuccess: () => {
            // Invalidate downloads list
            queryClient.invalidateQueries({ queryKey: ['downloads'] });
        }
    });
};

/**
 * Helper type for download button props.
 */
export interface DownloadTorrentParams {
    torrent: TorrentSearchResult;
}

/**
 * Helper type for movie download.
 */
export interface MovieDownloadParams extends DownloadTorrentParams {
    tmdbId: number;
    movieTitle: string;
    year?: number;
}

/**
 * Helper type for season download.
 */
export interface SeasonDownloadParams extends DownloadTorrentParams {
    tmdbId: number;
    seasonNumber: number;
    seriesName: string;
}

/**
 * Helper type for episode download.
 */
export interface EpisodeDownloadParams extends DownloadTorrentParams {
    tmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
    seriesName: string;
}

/**
 * Create a movie download request from params.
 */
export const createMovieDownloadRequest = (
    params: MovieDownloadParams
): StartDiscoveryMovieDownloadRequest => ({
    tmdbId: params.tmdbId,
    movieTitle: params.movieTitle,
    magnetLink: params.torrent.magnetLink,
    downloadUrl: params.torrent.downloadUrl,
    title: params.torrent.title,
    size: params.torrent.size,
    seeders: params.torrent.seeders,
    leechers: params.torrent.leechers,
    quality: params.torrent.quality,
    indexerName: params.torrent.indexerName,
    year: params.year
});

/**
 * Create a season download request from params.
 */
export const createSeasonDownloadRequest = (
    params: SeasonDownloadParams
): StartDiscoverySeasonDownloadRequest => ({
    tmdbId: params.tmdbId,
    seasonNumber: params.seasonNumber,
    magnetLink: params.torrent.magnetLink,
    downloadUrl: params.torrent.downloadUrl,
    title: params.torrent.title,
    size: params.torrent.size,
    seeders: params.torrent.seeders,
    leechers: params.torrent.leechers,
    quality: params.torrent.quality,
    indexerName: params.torrent.indexerName,
    seriesName: params.seriesName
});

/**
 * Create an episode download request from params.
 */
export const createEpisodeDownloadRequest = (
    params: EpisodeDownloadParams
): StartDiscoveryEpisodeDownloadRequest => ({
    tmdbId: params.tmdbId,
    seasonNumber: params.seasonNumber,
    episodeNumber: params.episodeNumber,
    magnetLink: params.torrent.magnetLink,
    downloadUrl: params.torrent.downloadUrl,
    title: params.torrent.title,
    size: params.torrent.size,
    seeders: params.torrent.seeders,
    leechers: params.torrent.leechers,
    quality: params.torrent.quality,
    indexerName: params.torrent.indexerName,
    seriesName: params.seriesName
});
