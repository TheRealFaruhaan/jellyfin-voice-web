import React, { type FC, useState, useEffect, useCallback } from 'react';
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
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useCustomTorrentSearch } from '../api/useDiscoveryApi';
import type { TorrentSearchResult, DiskSpaceInfo } from '../types';

interface TorrentResultsDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    results: TorrentSearchResult[];
    isLoading: boolean;
    isDownloading: boolean;
    error?: unknown;
    diskSpace?: DiskSpaceInfo;
    /** Category used when the user refines the search in place. */
    category?: 'movie' | 'tv';
    /** Seed for the refine field, e.g. "Show Name S03". */
    defaultQuery?: string;
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
    error,
    diskSpace,
    category = 'movie',
    defaultQuery = '',
    onDownload,
    onRefresh
}) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // Refining runs a custom search scoped to whatever this dialog was opened for,
    // so the download still files into the correct season/episode folder.
    const [queryInput, setQueryInput] = useState(defaultQuery);
    const [refinedQuery, setRefinedQuery] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setQueryInput(defaultQuery);
            setRefinedQuery(null);
        }
    }, [open, defaultQuery]);

    const refined = useCustomTorrentSearch(refinedQuery ?? '', category, !!refinedQuery);

    const isRefined = !!refinedQuery;
    const shownResults = isRefined ? (refined.data ?? []) : results;
    const shownLoading = isRefined ? refined.isLoading : isLoading;
    const shownError = isRefined ? refined.error : error;

    const handleRefine = useCallback(() => {
        const q = queryInput.trim();
        if (q.length >= 2) setRefinedQuery(q);
    }, [queryInput]);

    const handleResetRefine = useCallback(() => {
        setQueryInput(defaultQuery);
        setRefinedQuery(null);
    }, [defaultQuery]);

    const handleQueryKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRefine();
    }, [handleRefine]);

    const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQueryInput(e.target.value);
    }, []);

    const hasDiskSpaceWarning = diskSpace && !diskSpace.hasEnoughSpace;

    return (
        <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth fullScreen={isSmallScreen}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                    <TextField
                        fullWidth
                        size='small'
                        label='Refine search'
                        value={queryInput}
                        onChange={handleQueryChange}
                        onKeyDown={handleQueryKeyDown}
                        placeholder='e.g. Show Name S03 1080p'
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SearchIcon fontSize='small' />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                    <Button
                        variant='contained'
                        onClick={handleRefine}
                        disabled={queryInput.trim().length < 2 || shownLoading}
                    >
                        Search
                    </Button>
                    {isRefined && (
                        <Tooltip title='Back to automatic results'>
                            <span>
                                <IconButton onClick={handleResetRefine} disabled={shownLoading}>
                                    <RestartAltIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                </Box>

                {isRefined && (
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                        Showing refined results. Downloads still go to the same place as the
                        automatic search.
                    </Typography>
                )}

                {hasDiskSpaceWarning && (
                    <Alert severity='warning' sx={{ mb: 2 }}>
                        Low disk space! Free: {diskSpace.formattedFreeSpace}, Required minimum: {diskSpace.formattedMinimumRequired}
                    </Alert>
                )}

                {shownLoading && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
                        <CircularProgress />
                        <Typography color='text.secondary' variant='body2'>
                            Searching indexers — this can take up to a minute.
                        </Typography>
                    </Box>
                )}

                {!shownLoading && !!shownError && (
                    <Alert severity='error' sx={{ my: 2 }}>
                        Torrent search failed. The indexer may be slow or unreachable — check
                        the Prowlarr/Jackett connection, then retry.
                    </Alert>
                )}

                {!shownLoading && !shownError && shownResults.length === 0 && (
                    <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                        No torrents found. Try adjusting your indexer settings or use custom search.
                    </Typography>
                )}

                {!shownLoading && !shownError && shownResults.length > 0 && (
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
                                {shownResults.map((result, index) => (
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
