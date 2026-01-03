import React, { type FunctionComponent, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';

import type { TorrentDownload } from '../types';
import DownloadProgress from './DownloadProgress';
import DownloadStateChip from './DownloadStateChip';
import { usePauseDownload, useResumeDownload, useDeleteDownload, useImportDownload } from '../api/useDownloadActions';

interface DownloadCardProps {
    download: TorrentDownload;
}

const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let value = bytesPerSecond;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const formatEta = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '--';
    if (seconds > 86400) return `${Math.floor(seconds / 86400)}d`;
    if (seconds > 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    if (seconds > 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${seconds}s`;
};

const DownloadCard: FunctionComponent<DownloadCardProps> = ({ download }) => {
    const pauseMutation = usePauseDownload();
    const resumeMutation = useResumeDownload();
    const deleteMutation = useDeleteDownload();
    const importMutation = useImportDownload();

    const handlePause = useCallback(() => {
        pauseMutation.mutate(download.id);
    }, [download.id, pauseMutation]);

    const handleResume = useCallback(() => {
        resumeMutation.mutate(download.id);
    }, [download.id, resumeMutation]);

    const handleDelete = useCallback(() => {
        if (confirm('Delete this download? This will remove it from qBittorrent.')) {
            deleteMutation.mutate({ downloadId: download.id, deleteFiles: true });
        }
    }, [download.id, deleteMutation]);

    const handleImport = useCallback(() => {
        importMutation.mutate(download.id);
    }, [download.id, importMutation]);

    const isActive = download.state === 'Downloading' || download.state === 'Queued';
    const isPaused = download.state === 'Paused';
    const canImport = download.state === 'Completed' || download.state === 'Seeding';

    const mediaInfo = download.mediaType === 'Episode'
        ? `${download.seriesName} ${download.episodeCode}`
        : download.movieName;

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant='subtitle1' noWrap title={download.name}>
                            {download.name}
                        </Typography>
                        <Typography variant='body2' color='text.secondary' noWrap>
                            {mediaInfo} {download.quality && `- ${download.quality}`}
                        </Typography>
                    </Box>
                    <DownloadStateChip state={download.state} />
                </Box>

                <Box sx={{ my: 2 }}>
                    <DownloadProgress progress={download.progress} />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography variant='caption' color='text.secondary'>
                            {download.formattedSize}
                        </Typography>
                        {isActive && (
                            <>
                                <Typography variant='caption' color='text.secondary'>
                                    {formatSpeed(download.downloadSpeed)}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                    ETA: {formatEta(download.eta)}
                                </Typography>
                            </>
                        )}
                        <Typography variant='caption' color='text.secondary'>
                            {download.seeders} seeders
                        </Typography>
                    </Box>

                    <Box>
                        {isActive && (
                            <Tooltip title='Pause'>
                                <IconButton size='small' onClick={handlePause}>
                                    <PauseIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {isPaused && (
                            <Tooltip title='Resume'>
                                <IconButton size='small' onClick={handleResume}>
                                    <PlayArrowIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canImport && (
                            <Tooltip title='Import to Library'>
                                <IconButton size='small' onClick={handleImport}>
                                    <ArchiveIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title='Delete'>
                            <IconButton size='small' color='error' onClick={handleDelete}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {download.errorMessage && (
                    <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>
                        {download.errorMessage}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default DownloadCard;
