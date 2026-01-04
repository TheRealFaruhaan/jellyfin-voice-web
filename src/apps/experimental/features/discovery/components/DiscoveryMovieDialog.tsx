import React, { type FC, useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import StarIcon from '@mui/icons-material/Star';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';

import { useMovieDetails, useMovieTorrents, useDiskSpace } from '../api/useDiscoveryApi';
import {
    useStartDiscoveryMovieDownload,
    createMovieDownloadRequest
} from '../api/useDiscoveryDownload';
import type { DiscoveryMovie, TorrentSearchResult } from '../types';
import TorrentResultsDialog from './TorrentResultsDialog';
import CustomSearchDialog from './CustomSearchDialog';

interface DiscoveryMovieDialogProps {
    open: boolean;
    onClose: () => void;
    tmdbId: number;
    imageBaseUrl?: string;
}

const DiscoveryMovieDialog: FC<DiscoveryMovieDialogProps> = ({
    open,
    onClose,
    tmdbId,
    imageBaseUrl = 'https://image.tmdb.org/t/p/w500'
}) => {
    const [showTorrents, setShowTorrents] = useState(false);
    const [showCustomSearch, setShowCustomSearch] = useState(false);

    const { data: movie, isLoading: isLoadingMovie } = useMovieDetails(tmdbId, open);
    const { data: torrents, isLoading: isLoadingTorrents, refetch: refetchTorrents } = useMovieTorrents(tmdbId, showTorrents);
    const { data: diskSpace } = useDiskSpace('movies');

    const downloadMutation = useStartDiscoveryMovieDownload();

    const handleDownload = useCallback(async (torrent: TorrentSearchResult) => {
        if (!movie) return;

        const year = movie.releaseDate ? parseInt(movie.releaseDate.substring(0, 4), 10) : undefined;

        await downloadMutation.mutateAsync(
            createMovieDownloadRequest({
                tmdbId,
                torrent,
                year
            })
        );

        setShowTorrents(false);
        onClose();
    }, [movie, tmdbId, downloadMutation, onClose]);

    const handleCustomDownload = useCallback(async (torrent: TorrentSearchResult) => {
        if (!movie) return;

        const year = movie.releaseDate ? parseInt(movie.releaseDate.substring(0, 4), 10) : undefined;

        await downloadMutation.mutateAsync(
            createMovieDownloadRequest({
                tmdbId,
                torrent,
                year
            })
        );

        setShowCustomSearch(false);
        onClose();
    }, [movie, tmdbId, downloadMutation, onClose]);

    const backdropUrl = movie?.backdropPath
        ? `${imageBaseUrl}${movie.backdropPath}`
        : undefined;

    const posterUrl = movie?.posterPath
        ? `https://image.tmdb.org/t/p/w342${movie.posterPath}`
        : undefined;

    const year = movie?.releaseDate?.substring(0, 4);

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
                <DialogTitle sx={{ pb: 0 }}>
                    {isLoadingMovie ? 'Loading...' : movie?.title}
                </DialogTitle>

                <DialogContent>
                    {isLoadingMovie ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : movie ? (
                        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                            {/* Poster */}
                            <Box
                                sx={{
                                    width: 200,
                                    flexShrink: 0,
                                    bgcolor: 'grey.800',
                                    borderRadius: 1,
                                    overflow: 'hidden'
                                }}
                            >
                                {posterUrl ? (
                                    <img
                                        src={posterUrl}
                                        alt={movie.title}
                                        style={{ width: '100%', display: 'block' }}
                                    />
                                ) : (
                                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color='text.secondary'>No Image</Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Details */}
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    {year && (
                                        <Chip label={year} size='small' />
                                    )}
                                    {movie.voteAverage > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                                            <Typography variant='body2'>
                                                {movie.voteAverage.toFixed(1)}
                                            </Typography>
                                        </Box>
                                    )}
                                    {movie.existsInLibrary && (
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label='In Library'
                                            size='small'
                                            color='success'
                                        />
                                    )}
                                </Box>

                                {movie.overview && (
                                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                        {movie.overview}
                                    </Typography>
                                )}

                                {movie.originalTitle && movie.originalTitle !== movie.title && (
                                    <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 1 }}>
                                        Original title: {movie.originalTitle}
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                                    <Button
                                        variant='contained'
                                        startIcon={<DownloadIcon />}
                                        onClick={() => setShowTorrents(true)}
                                        disabled={movie.existsInLibrary}
                                    >
                                        Find Torrents
                                    </Button>
                                    <Button
                                        variant='outlined'
                                        startIcon={<SearchIcon />}
                                        onClick={() => setShowCustomSearch(true)}
                                    >
                                        Custom Search
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    ) : (
                        <Typography color='error'>Failed to load movie details</Typography>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Torrent Results Dialog */}
            <TorrentResultsDialog
                open={showTorrents}
                onClose={() => setShowTorrents(false)}
                title={`Torrents for ${movie?.title || 'Movie'}`}
                results={torrents || []}
                isLoading={isLoadingTorrents}
                isDownloading={downloadMutation.isPending}
                diskSpace={diskSpace}
                onDownload={handleDownload}
                onRefresh={() => refetchTorrents()}
            />

            {/* Custom Search Dialog */}
            <CustomSearchDialog
                open={showCustomSearch}
                onClose={() => setShowCustomSearch(false)}
                defaultQuery={movie?.title || ''}
                category='movie'
                diskSpace={diskSpace}
                onDownload={handleCustomDownload}
            />
        </>
    );
};

export default DiscoveryMovieDialog;
