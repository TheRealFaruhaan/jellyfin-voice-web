import Cancel from '@mui/icons-material/Cancel';
import CloudOff from '@mui/icons-material/CloudOff';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import React, { FC, useCallback } from 'react';

import globalize from 'lib/globalize';
import type { TorrentDownload } from 'apps/dashboard/features/downloads/types';
import {
    usePauseDownload,
    useResumeDownload,
    useDeleteDownload
} from 'apps/dashboard/features/downloads/api/useDownloadActions';

export const ID = 'app-downloads-menu';

interface DownloadsMenuProps extends MenuProps {
    onMenuClose: () => void;
    downloads: TorrentDownload[];
}

const DownloadsMenu: FC<DownloadsMenuProps> = ({
    anchorEl,
    open,
    onMenuClose,
    downloads
}) => {
    const pauseMutation = usePauseDownload();
    const resumeMutation = useResumeDownload();
    const deleteMutation = useDeleteDownload();

    const handlePause = useCallback((downloadId: string) => {
        pauseMutation.mutate(downloadId);
    }, [pauseMutation]);

    const handleResume = useCallback((downloadId: string) => {
        resumeMutation.mutate(downloadId);
    }, [resumeMutation]);

    const handleStop = useCallback((downloadId: string) => {
        if (confirm('Stop and remove this download? Downloaded files will be kept.')) {
            deleteMutation.mutate({ downloadId, deleteFiles: false });
        }
    }, [deleteMutation]);

    const getStateColor = (state: string) => {
        switch (state) {
            case 'Downloading':
                return 'primary';
            case 'Completed':
            case 'Seeding':
                return 'success';
            case 'Paused':
                return 'warning';
            case 'Error':
                return 'error';
            default:
                return 'default';
        }
    };

    const formatSpeed = (bytesPerSec: number): string => {
        if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
        if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
        return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    };

    const formatEta = (seconds?: number): string => {
        if (!seconds || seconds <= 0) return '';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    };

    const getDisplayName = (download: TorrentDownload): string => {
        if (download.mediaType === 'Episode' && download.seriesName) {
            const episode = download.episodeCode || `S${download.seasonNumber}E${download.episodeNumber}`;
            return `${download.seriesName} ${episode}`;
        }
        return download.name;
    };

    const menuItems = [];

    if (downloads.length === 0) {
        menuItems.push(
            <MenuItem key='no-downloads' disabled>
                <ListItemIcon>
                    <CloudOff />
                </ListItemIcon>
                <ListItemText primary='No active downloads' />
            </MenuItem>
        );
    } else {
        downloads.forEach((download, index) => {
            const isActive = ['Downloading', 'Queued', 'Paused'].includes(download.state);
            const canPause = download.state === 'Downloading';
            const canResume = download.state === 'Paused';

            menuItems.push(
                <MenuItem
                    key={download.id}
                    sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 1.5,
                        minWidth: 350,
                        maxWidth: 500
                    }}
                    disableRipple
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant='body2'
                                noWrap
                                sx={{ fontWeight: 500 }}
                            >
                                {getDisplayName(download)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                                <Chip
                                    label={download.state}
                                    size='small'
                                    color={getStateColor(download.state)}
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                {download.quality && (
                                    <Chip
                                        label={download.quality}
                                        size='small'
                                        variant='outlined'
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {canPause && (
                                <IconButton
                                    size='small'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePause(download.id);
                                    }}
                                    title='Pause'
                                >
                                    <Pause fontSize='small' />
                                </IconButton>
                            )}
                            {canResume && (
                                <IconButton
                                    size='small'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleResume(download.id);
                                    }}
                                    title='Resume'
                                >
                                    <PlayArrow fontSize='small' />
                                </IconButton>
                            )}
                            {isActive && (
                                <IconButton
                                    size='small'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStop(download.id);
                                    }}
                                    title='Stop'
                                    color='error'
                                >
                                    <Cancel fontSize='small' />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    {download.state === 'Downloading' && (
                        <Box sx={{ mt: 1 }}>
                            <LinearProgress
                                variant='determinate'
                                value={download.progress}
                                sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant='caption' color='text.secondary'>
                                    {Math.round(download.progress)}% • {formatSpeed(download.downloadSpeed)}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                    {formatEta(download.eta)}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {download.state === 'Paused' && (
                        <Box sx={{ mt: 1 }}>
                            <LinearProgress
                                variant='determinate'
                                value={download.progress}
                                color='warning'
                                sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                                Paused at {Math.round(download.progress)}%
                            </Typography>
                        </Box>
                    )}

                    {download.state === 'Completed' && (
                        <Typography variant='caption' color='success.main' sx={{ mt: 0.5 }}>
                            Download complete • {download.formattedSize}
                        </Typography>
                    )}

                    {download.state === 'Error' && download.errorMessage && (
                        <Typography variant='caption' color='error' sx={{ mt: 0.5 }}>
                            Error: {download.errorMessage}
                        </Typography>
                    )}
                </MenuItem>
            );

            if (index < downloads.length - 1) {
                menuItems.push(<Divider key={`divider-${download.id}`} />);
            }
        });
    }

    return (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
            }}
            id={ID}
            keepMounted
            open={open}
            onClose={onMenuClose}
        >
            {menuItems}
        </Menu>
    );
};

export default DownloadsMenu;
