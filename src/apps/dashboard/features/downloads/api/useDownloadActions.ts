import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { QUERY_KEY } from './useDownloads';
import { authenticatedPost, authenticatedDelete } from './authenticatedFetch';

export const usePauseDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (downloadId: string): Promise<void> => {
            await authenticatedPost<void>(api!, `/MediaAcquisition/Downloads/${downloadId}/Pause`);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }
    });
};

export const useResumeDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (downloadId: string): Promise<void> => {
            await authenticatedPost<void>(api!, `/MediaAcquisition/Downloads/${downloadId}/Resume`);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }
    });
};

export const useDeleteDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ downloadId, deleteFiles = false }: { downloadId: string; deleteFiles?: boolean }): Promise<void> => {
            await authenticatedDelete<void>(api!, `/MediaAcquisition/Downloads/${downloadId}`, {
                params: { deleteFiles }
            });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }
    });
};

export const useImportDownload = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (downloadId: string): Promise<void> => {
            await authenticatedPost<void>(api!, `/MediaAcquisition/Downloads/${downloadId}/Import`);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }
    });
};
