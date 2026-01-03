import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { TorrentDownload } from '../types';
import { authenticatedGet } from './authenticatedFetch';

export const QUERY_KEY = 'MediaAcquisitionDownloads';

export const useDownloads = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: ({ signal }) => authenticatedGet<TorrentDownload[]>(
            api!,
            '/MediaAcquisition/Downloads',
            { signal }
        ),
        enabled: !!api,
        refetchInterval: 5000 // Refresh every 5 seconds
    });
};

export const useActiveDownloads = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, 'active'],
        queryFn: ({ signal }) => authenticatedGet<TorrentDownload[]>(
            api!,
            '/MediaAcquisition/Downloads/Active',
            { signal }
        ),
        enabled: !!api,
        refetchInterval: 3000 // Refresh every 3 seconds for active downloads
    });
};

export const useDownload = (downloadId: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, downloadId],
        queryFn: ({ signal }) => authenticatedGet<TorrentDownload>(
            api!,
            `/MediaAcquisition/Downloads/${downloadId}`,
            { signal }
        ),
        enabled: !!api && !!downloadId
    });
};
