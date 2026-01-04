import React, { type FC, useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
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
import SearchIcon from '@mui/icons-material/Search';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';

import { useCustomTorrentSearch } from '../api/useDiscoveryApi';
import type { TorrentSearchResult, DiskSpaceInfo } from '../types';

interface CustomSearchDialogProps {
    open: boolean;
    onClose: () => void;
    defaultQuery?: string;
    category: 'movie' | 'tv';
    diskSpace?: DiskSpaceInfo;
    onDownload: (torrent: TorrentSearchResult) => void;
}

const CustomSearchDialog: FC<CustomSearchDialogProps> = ({
    open,
    onClose,
    defaultQuery = '',
    category,
    diskSpace,
    onDownload
}) => {
    const [query, setQuery] = useState(defaultQuery);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    const { data: results, isLoading, refetch } = useCustomTorrentSearch(
        searchQuery,
        category,
        searchQuery.length >= 2
    );

    const handleSearch = useCallback(() => {
        if (query.length >= 2) {
            setSearchQuery(query);
        }
    }, [query]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    const handleDownload = useCallback(async (torrent: TorrentSearchResult) => {
        setIsDownloading(true);
        try {
            await onDownload(torrent);
        } finally {
            setIsDownloading(false);
        }
    }, [onDownload]);

    // Reset search query when default query changes
    React.useEffect(() => {
        setQuery(defaultQuery);
        setSearchQuery('');
    }, [defaultQuery, open]);

    const hasDiskSpaceWarning = diskSpace && !diskSpace.hasEnoughSpace;

    return (
        <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
            <DialogTitle>Custom Torrent Search</DialogTitle>
            <DialogContent>
                {hasDiskSpaceWarning && (
                    <Alert severity='warning' sx={{ mb: 2 }}>
                        Low disk space! Free: {diskSpace.formattedFreeSpace}, Required minimum: {diskSpace.formattedMinimumRequired}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        fullWidth
                        size='small'
                        placeholder='Enter search query...'
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton onClick={handleSearch} disabled={isLoading || query.length < 2}>
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : !searchQuery ? (
                    <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                        Enter a search query to find torrents
                    </Typography>
                ) : (results?.length || 0) === 0 ? (
                    <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                        No torrents found for &quot;{searchQuery}&quot;
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
                                {results?.map((result, index) => (
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
                                                        onClick={() => handleDownload(result)}
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
                <Button onClick={() => refetch()} disabled={isLoading || !searchQuery}>
                    Refresh
                </Button>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomSearchDialog;
