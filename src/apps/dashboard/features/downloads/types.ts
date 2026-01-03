/**
 * Represents a torrent download.
 */
export interface TorrentDownload {
    id: string;
    torrentHash: string;
    name: string;
    mediaType: 'Episode' | 'Movie';
    seriesId?: string;
    seriesName?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    movieId?: string;
    movieName?: string;
    state: TorrentState;
    progress: number;
    totalSize: number;
    downloadedSize: number;
    downloadSpeed: number;
    uploadSpeed: number;
    seeders: number;
    leechers: number;
    eta?: number;
    quality?: string;
    indexerName?: string;
    addedAt: string;
    completedAt?: string;
    importedAt?: string;
    errorMessage?: string;
    formattedSize: string;
    formattedSpeed: string;
    episodeCode?: string;
}

/**
 * Download states.
 */
export type TorrentState =
    | 'Queued'
    | 'Downloading'
    | 'Paused'
    | 'Completed'
    | 'Importing'
    | 'Imported'
    | 'Error'
    | 'Seeding';

/**
 * Represents a torrent search result.
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
 * Represents a missing episode.
 */
export interface MissingEpisodeInfo {
    seriesId: string;
    seriesName: string;
    seasonId?: string;
    seasonNumber: number;
    episodeId?: string;
    episodeNumber: number;
    episodeName?: string;
    airDate?: string;
    overview?: string;
    seriesProviderIds: Record<string, string>;
    hasActiveDownload: boolean;
    activeDownloadId?: string;
    episodeCode: string;
}

/**
 * Connection status response.
 */
export interface ConnectionStatus {
    qBittorrentConnected: boolean;
    indexers: Record<string, boolean>;
}

/**
 * Request to start an episode download.
 */
export interface StartEpisodeDownloadRequest {
    seriesId: string;
    seasonNumber: number;
    episodeNumber: number;
    magnetLink: string;
    title: string;
    size: number;
    seeders: number;
    leechers: number;
    quality?: string;
    indexerName?: string;
}

/**
 * Request to start a movie download.
 */
export interface StartMovieDownloadRequest {
    movieId: string;
    magnetLink: string;
    title: string;
    size: number;
    seeders: number;
    leechers: number;
    quality?: string;
    indexerName?: string;
}

/**
 * Request to search for episode torrents.
 */
export interface SearchEpisodeRequest {
    seriesId: string;
    seasonNumber: number;
    episodeNumber: number;
}

/**
 * Request to search for movie torrents.
 */
export interface SearchMovieRequest {
    movieId?: string;
    movieName?: string;
    year?: number;
}
