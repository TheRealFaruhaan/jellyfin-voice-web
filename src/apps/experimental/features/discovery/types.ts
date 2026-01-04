/**
 * Discovery feature types for TMDB integration.
 */

/**
 * External IDs from various providers.
 */
export interface DiscoveryExternalIds {
    imdbId?: string;
    tvdbId?: number;
}

/**
 * A discovered movie from TMDB.
 */
export interface DiscoveryMovie {
    id: number;
    title: string;
    originalTitle?: string;
    overview?: string;
    posterPath?: string;
    backdropPath?: string;
    releaseDate?: string;
    voteAverage: number;
    voteCount: number;
    popularity: number;
    genreIds: number[];
    adult: boolean;
    originalLanguage?: string;
    externalIds?: DiscoveryExternalIds;
    existsInLibrary: boolean;
    jellyfinItemId?: string;
}

/**
 * A discovered TV show from TMDB.
 */
export interface DiscoveryTvShow {
    id: number;
    name: string;
    originalName?: string;
    overview?: string;
    posterPath?: string;
    backdropPath?: string;
    firstAirDate?: string;
    voteAverage: number;
    voteCount: number;
    popularity: number;
    genreIds: number[];
    originalLanguage?: string;
    externalIds?: DiscoveryExternalIds;
    existsInLibrary: boolean;
    jellyfinItemId?: string;
    numberOfSeasons?: number;
    numberOfEpisodes?: number;
}

/**
 * A season from a TV show.
 */
export interface DiscoverySeason {
    id: number;
    seasonNumber: number;
    name: string;
    overview?: string;
    posterPath?: string;
    airDate?: string;
    episodeCount: number;
    episodes?: DiscoveryEpisode[];
}

/**
 * An episode from a TV show season.
 */
export interface DiscoveryEpisode {
    id: number;
    episodeNumber: number;
    seasonNumber: number;
    name: string;
    overview?: string;
    stillPath?: string;
    airDate?: string;
    voteAverage: number;
    voteCount: number;
    runtime?: number;
}

/**
 * Paginated discovery results.
 */
export interface DiscoveryPagedResult<T> {
    page: number;
    totalPages: number;
    totalResults: number;
    results: T[];
}

/**
 * Disk space information.
 */
export interface DiskSpaceInfo {
    freeSpaceBytes: number;
    formattedFreeSpace: string;
    hasEnoughSpace: boolean;
    minimumRequiredBytes: number;
    formattedMinimumRequired: string;
}

/**
 * Request to start downloading a discovered movie.
 */
export interface StartDiscoveryMovieDownloadRequest {
    tmdbId: number;
    magnetLink: string;
    title: string;
    size: number;
    seeders: number;
    leechers: number;
    quality?: string;
    indexerName?: string;
    year?: number;
}

/**
 * Request to start downloading a discovered season.
 */
export interface StartDiscoverySeasonDownloadRequest {
    tmdbId: number;
    seasonNumber: number;
    magnetLink: string;
    title: string;
    size: number;
    seeders: number;
    leechers: number;
    quality?: string;
    indexerName?: string;
    seriesName: string;
}

/**
 * Request to start downloading a discovered episode.
 */
export interface StartDiscoveryEpisodeDownloadRequest {
    tmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
    magnetLink: string;
    title: string;
    size: number;
    seeders: number;
    leechers: number;
    quality?: string;
    indexerName?: string;
    seriesName: string;
}

/**
 * Request for custom torrent search.
 */
export interface CustomTorrentSearchRequest {
    query: string;
    category: 'movie' | 'tv';
}

/**
 * Torrent search result (re-exported from downloads types for convenience).
 */
export interface TorrentSearchResult {
    title: string;
    magnetLink: string;
    infoHash?: string;
    size: number;
    seeders: number;
    leechers: number;
    quality?: string;
    source?: string;
    codec?: string;
    indexerName: string;
    publishDate?: string;
    downloadUrl?: string;
    detailsUrl?: string;
    category?: string;
    formattedSize: string;
}

/**
 * Discovery view mode.
 */
export type DiscoveryViewMode = 'trending' | 'popular' | 'search';

/**
 * Discovery category.
 */
export type DiscoveryCategory = 'movies' | 'tvshows';
