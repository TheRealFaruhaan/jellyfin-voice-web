import React, { type FunctionComponent } from 'react';
import Chip from '@mui/material/Chip';
import DownloadIcon from '@mui/icons-material/Download';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import UploadIcon from '@mui/icons-material/Upload';
import ArchiveIcon from '@mui/icons-material/Archive';

import type { TorrentState } from '../types';

interface DownloadStateChipProps {
    state: TorrentState;
    size?: 'small' | 'medium';
}

const stateConfig: Record<TorrentState, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; icon: React.ReactElement }> = {
    Queued: { label: 'Queued', color: 'default', icon: <HourglassEmptyIcon /> },
    Downloading: { label: 'Downloading', color: 'primary', icon: <DownloadIcon /> },
    Paused: { label: 'Paused', color: 'warning', icon: <PauseIcon /> },
    Completed: { label: 'Completed', color: 'success', icon: <CheckCircleIcon /> },
    Importing: { label: 'Importing', color: 'info', icon: <ArchiveIcon /> },
    Imported: { label: 'Imported', color: 'success', icon: <CheckCircleIcon /> },
    Error: { label: 'Error', color: 'error', icon: <ErrorIcon /> },
    Seeding: { label: 'Seeding', color: 'secondary', icon: <UploadIcon /> }
};

const DownloadStateChip: FunctionComponent<DownloadStateChipProps> = ({
    state,
    size = 'small'
}) => {
    const config = stateConfig[state] || stateConfig.Queued;

    return (
        <Chip
            icon={config.icon}
            label={config.label}
            color={config.color}
            size={size}
            variant='outlined'
        />
    );
};

export default DownloadStateChip;
