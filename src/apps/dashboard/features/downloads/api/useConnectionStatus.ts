import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { ConnectionStatus } from '../types';
import { authenticatedGet } from './authenticatedFetch';

export const QUERY_KEY = 'MediaAcquisitionStatus';

export const useConnectionStatus = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: ({ signal }) => authenticatedGet<ConnectionStatus>(
            api!,
            '/MediaAcquisition/Status',
            { signal }
        ),
        enabled: !!api,
        refetchInterval: 30000 // Check every 30 seconds
    });
};
