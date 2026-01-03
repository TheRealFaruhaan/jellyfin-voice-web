import React, { type FunctionComponent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import { useDownloads } from '../api/useDownloads';
import { useConnectionStatus } from '../api/useConnectionStatus';
import { useLiveDownloads } from '../hooks/useLiveDownloads';
import DownloadCard from './DownloadCard';

const DownloadsList: FunctionComponent = () => {
    // Subscribe to WebSocket updates for live progress
    useLiveDownloads();

    const { data: downloads, isLoading, error } = useDownloads();
    const { data: status } = useConnectionStatus();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity='error' sx={{ m: 2 }}>
                Failed to load downloads. Make sure the Media Acquisition feature is enabled.
            </Alert>
        );
    }

    return (
        <Box>
            {status && !status.qBittorrentConnected && (
                <Alert severity='warning' sx={{ mb: 2 }}>
                    qBittorrent is not connected. Check your configuration.
                </Alert>
            )}

            {!downloads || downloads.length === 0 ? (
                <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                    No downloads yet. Search for missing episodes or movies to start downloading.
                </Typography>
            ) : (
                <Box>
                    {downloads.map((download) => (
                        <DownloadCard key={download.id} download={download} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default DownloadsList;
