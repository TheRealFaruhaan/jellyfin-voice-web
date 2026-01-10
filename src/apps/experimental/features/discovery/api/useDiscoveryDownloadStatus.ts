import { useQuery } from '@tanstack/react-query';
import { Md5 } from 'ts-md5';

import { useApi } from 'hooks/useApi';
import { authenticatedGet } from 'apps/dashboard/features/downloads/api/authenticatedFetch';
import type { TorrentDownload } from 'apps/dashboard/features/downloads/types';

/**
 * Creates a deterministic GUID from a TMDB ID.
 * Matches the C# implementation in DownloadManagerService.
 */
function createGuidFromTmdbId(type: 'movie' | 'tv', tmdbId: number): string {
    const input = `tmdb:${type}:${tmdbId}`;
    const hash = Md5.hashStr(input);

    // Convert hash string to GUID format (8-4-4-4-12)
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

/**
 * Hook to get active downloads.
 */
export const useActiveDownloads = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['downloads', 'active'],
        queryFn: ({ signal }) => authenticatedGet<TorrentDownload[]>(
            api!,
            '/MediaAcquisition/Downloads/Active',
            { signal }
        ),
        enabled: !!api,
        refetchInterval: 3000, // Refresh every 3 seconds
        staleTime: 2000
    });
};

/**
 * Hook to check if a discovery item is currently downloading.
 */
export const useIsDownloading = (tmdbId: number, mediaType: 'movie' | 'tvshow') => {
    const { data: downloads } = useActiveDownloads();

    if (!downloads || downloads.length === 0) {
        return { isDownloading: false, progress: 0 };
    }

    const type = mediaType === 'movie' ? 'movie' : 'tv';
    const expectedGuid = createGuidFromTmdbId(type, tmdbId).toLowerCase();

    // Debug logging
    console.log(`[useIsDownloading] TMDB ID: ${tmdbId}, Type: ${type}, Expected GUID: ${expectedGuid}`);
    downloads.forEach(d => {
        const downloadId = (mediaType === 'movie' ? d.movieId : d.seriesId)?.toLowerCase();
        console.log(`  Download: ${d.name || d.movieName || d.seriesName}, ID: ${downloadId}, MovieName: ${d.movieName}`);
    });

    // Find download by matching movieId or seriesId
    const download = downloads.find(d => {
        const downloadId = (mediaType === 'movie' ? d.movieId : d.seriesId)?.toLowerCase();
        return downloadId === expectedGuid;
    });

    if (download) {
        console.log(`[useIsDownloading] Found matching download for TMDB ${tmdbId}: ${download.movieName || download.seriesName}`);
    }

    return {
        isDownloading: !!download,
        progress: download?.progress || 0,
        state: download?.state
    };
};
