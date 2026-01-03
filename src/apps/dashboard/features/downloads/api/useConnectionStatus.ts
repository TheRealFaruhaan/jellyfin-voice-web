import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { ConnectionStatus } from '../types';

export const QUERY_KEY = 'MediaAcquisitionStatus';

export const useConnectionStatus = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: async ({ signal }) => {
            const response = await api!.axiosInstance.get<ConnectionStatus>(
                '/MediaAcquisition/Status',
                { signal }
            );
            return response.data;
        },
        enabled: !!api,
        refetchInterval: 30000 // Check every 30 seconds
    });
};
