import React, { type FunctionComponent } from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

interface DownloadProgressProps {
    progress: number;
    showLabel?: boolean;
}

const DownloadProgress: FunctionComponent<DownloadProgressProps> = ({
    progress,
    showLabel = true
}) => {
    const normalizedProgress = Math.min(100, Math.max(0, progress));

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ width: '100%', mr: showLabel ? 1 : 0 }}>
                <LinearProgress
                    variant='determinate'
                    value={normalizedProgress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4
                        }
                    }}
                />
            </Box>
            {showLabel && (
                <Box sx={{ minWidth: 45 }}>
                    <Typography variant='body2' color='text.secondary'>
                        {`${Math.round(normalizedProgress)}%`}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default DownloadProgress;
