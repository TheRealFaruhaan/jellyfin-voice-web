import CloudDownload from '@mui/icons-material/CloudDownload';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { useCallback, useState } from 'react';

import globalize from 'lib/globalize';
import { useActiveDownloads } from 'apps/dashboard/features/downloads/api/useDownloads';
import { useLiveDownloads } from 'apps/dashboard/features/downloads/hooks/useLiveDownloads';

import DownloadsMenu, { ID } from './menus/DownloadsMenu';

const DownloadsButton = () => {
    const { data: activeDownloads = [] } = useActiveDownloads();
    const [ downloadsMenuAnchorEl, setDownloadsMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isDownloadsMenuOpen = Boolean(downloadsMenuAnchorEl);

    // Subscribe to live download updates via WebSocket
    useLiveDownloads();

    const onDownloadsButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setDownloadsMenuAnchorEl(event.currentTarget);
    }, [ setDownloadsMenuAnchorEl ]);

    const onDownloadsMenuClose = useCallback(() => {
        setDownloadsMenuAnchorEl(null);
    }, [ setDownloadsMenuAnchorEl ]);

    // Don't show button if no downloads at all (both active and inactive)
    // Once user starts any download, the button stays visible
    if (activeDownloads.length === 0 && !isDownloadsMenuOpen) {
        return null;
    }

    const activeCount = activeDownloads.filter(d =>
        ['Downloading', 'Queued', 'Paused'].includes(d.state)
    ).length;

    return (
        <>
            <Tooltip title={globalize.translate('Downloads')}>
                <IconButton
                    size='large'
                    aria-label='Downloads'
                    aria-controls={ID}
                    aria-haspopup='true'
                    onClick={onDownloadsButtonClick}
                    color='inherit'
                >
                    <Badge badgeContent={activeCount} color='primary'>
                        <CloudDownload />
                    </Badge>
                </IconButton>
            </Tooltip>

            <DownloadsMenu
                open={isDownloadsMenuOpen}
                anchorEl={downloadsMenuAnchorEl}
                onMenuClose={onDownloadsMenuClose}
                downloads={activeDownloads}
            />
        </>
    );
};

export default DownloadsButton;
