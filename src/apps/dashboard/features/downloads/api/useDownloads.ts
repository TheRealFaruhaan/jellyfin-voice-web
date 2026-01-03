import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import type { TorrentDownload } from '../types';

export const QUERY_KEY = 'MediaAcquisitionDownloads';

const fetchDownloads = async (
    api: { axiosInstance: { get: (url: string, config?: AxiosRequestConfig) => Promise<{ data: TorrentDownload[] }> } },
    options?: AxiosRequestConfig
): Promise<TorrentDownload[]> => {
    const response = await api.axiosInstance.get('/MediaAcquisition/Downloads', options);
    return response.data;
};

export const useDownloads = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: ({ signal }) => fetchDownloads(api!, { signal }),
        enabled: !!api,
        refetchInterval: 5000 // Refresh every 5 seconds
    });
};

export const useActiveDownloads = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, 'active'],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<TorrentDownload[]>(
                '/MediaAcquisition/Downloads/Active',
                { signal }
            );
            return response.data;
        },
        enabled: !!api,
        refetchInterval: 3000 // Refresh every 3 seconds for active downloads
    });
};

export const useDownload = (downloadId: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY, downloadId],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<TorrentDownload>(
                `/MediaAcquisition/Downloads/${downloadId}`,
                { signal }
            );
            return response.data;
        },
        enabled: !!api && !!downloadId
    });
};
