import React, { type FC } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';

import type { TorrentSearchResult, DiskSpaceInfo } from '../types';

interface TorrentResultsDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    results: TorrentSearchResult[];
    isLoading: boolean;
    isDownloading: boolean;
    diskSpace?: DiskSpaceInfo;
    onDownload: (torrent: TorrentSearchResult) => void;
    onRefresh: () => void;
}

const TorrentResultsDialog: FC<TorrentResultsDialogProps> = ({
    open,
    onClose,
    title,
    results,
    isLoading,
    isDownloading,
    diskSpace,
    onDownload,
    onRefresh
}) => {
    const hasDiskSpaceWarning = diskSpace && !diskSpace.hasEnoughSpace;

    return (
        <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {hasDiskSpaceWarning && (
                    <Alert severity='warning' sx={{ mb: 2 }}>
                        Low disk space! Free: {diskSpace.formattedFreeSpace}, Required minimum: {diskSpace.formattedMinimumRequired}
                    </Alert>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : results.length === 0 ? (
                    <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                        No torrents found. Try adjusting your indexer settings or use custom search.
                    </Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size='small'>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell align='right'>Quality</TableCell>
                                    <TableCell align='right'>Size</TableCell>
                                    <TableCell align='right'>Seeders</TableCell>
                                    <TableCell align='right'>Indexer</TableCell>
                                    <TableCell align='center'>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {results.map((result, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant='body2' noWrap sx={{ maxWidth: 400 }} title={result.title}>
                                                {result.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align='right'>
                                            {result.quality && (
                                                <Chip label={result.quality} size='small' color='primary' variant='outlined' />
                                            )}
                                        </TableCell>
                                        <TableCell align='right'>
                                            {result.formattedSize}
                                        </TableCell>
                                        <TableCell align='right'>
                                            <Typography
                                                variant='body2'
                                                color={result.seeders > 10 ? 'success.main' : result.seeders > 0 ? 'warning.main' : 'error.main'}
                                            >
                                                {result.seeders}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align='right'>
                                            <Typography variant='caption' color='text.secondary'>
                                                {result.indexerName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align='center'>
                                            <Tooltip title='Download'>
                                                <span>
                                                    <IconButton
                                                        size='small'
                                                        color='primary'
                                                        onClick={() => onDownload(result)}
                                                        disabled={isDownloading || hasDiskSpaceWarning}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onRefresh} disabled={isLoading}>
                    Refresh
                </Button>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TorrentResultsDialog;
