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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import {
    useTvShowDetails,
    useSeasonDetails,
    useSeasonTorrents,
    useEpisodeTorrents,
    useDiskSpace
} from '../api/useDiscoveryApi';
import {
    useStartDiscoverySeasonDownload,
    useStartDiscoveryEpisodeDownload,
    createSeasonDownloadRequest,
    createEpisodeDownloadRequest
} from '../api/useDiscoveryDownload';
import type { TorrentSearchResult } from '../types';
import TorrentResultsDialog from './TorrentResultsDialog';
import CustomSearchDialog from './CustomSearchDialog';

interface DiscoveryTvShowDialogProps {
    open: boolean;
    onClose: () => void;
    tmdbId: number;
    imageBaseUrl?: string;
}

const DiscoveryTvShowDialog: FC<DiscoveryTvShowDialogProps> = ({
    open,
    onClose,
    tmdbId,
    imageBaseUrl = 'https://image.tmdb.org/t/p/w500'
}) => {
    const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
    const [showSeasonTorrents, setShowSeasonTorrents] = useState(false);
    const [showEpisodeTorrents, setShowEpisodeTorrents] = useState(false);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
    const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number | null>(null);
    const [showCustomSearch, setShowCustomSearch] = useState(false);

    const { data: tvShow, isLoading: isLoadingTvShow } = useTvShowDetails(tmdbId, open);
    const { data: seasonDetails, isLoading: isLoadingSeason } = useSeasonDetails(
        tmdbId,
        expandedSeason ?? 0,
        expandedSeason !== null
    );
    const { data: seasonTorrents, isLoading: isLoadingSeasonTorrents, refetch: refetchSeasonTorrents } =
        useSeasonTorrents(tmdbId, selectedSeasonNumber ?? 0, showSeasonTorrents && selectedSeasonNumber !== null);
    const { data: episodeTorrents, isLoading: isLoadingEpisodeTorrents, refetch: refetchEpisodeTorrents } =
        useEpisodeTorrents(
            tmdbId,
            selectedSeasonNumber ?? 0,
            selectedEpisodeNumber ?? 0,
            showEpisodeTorrents && selectedSeasonNumber !== null && selectedEpisodeNumber !== null
        );
    const { data: diskSpace } = useDiskSpace('tvshows');

    const seasonDownloadMutation = useStartDiscoverySeasonDownload();
    const episodeDownloadMutation = useStartDiscoveryEpisodeDownload();

    const handleSeasonExpand = useCallback((seasonNumber: number) => {
        setExpandedSeason(expandedSeason === seasonNumber ? null : seasonNumber);
    }, [expandedSeason]);

    const handleSearchSeasonTorrents = useCallback((seasonNumber: number) => {
        setSelectedSeasonNumber(seasonNumber);
        setShowSeasonTorrents(true);
    }, []);

    const handleSearchEpisodeTorrents = useCallback((seasonNumber: number, episodeNumber: number) => {
        setSelectedSeasonNumber(seasonNumber);
        setSelectedEpisodeNumber(episodeNumber);
        setShowEpisodeTorrents(true);
    }, []);

    const handleSeasonDownload = useCallback(async (torrent: TorrentSearchResult) => {
        if (!tvShow || selectedSeasonNumber === null) return;

        await seasonDownloadMutation.mutateAsync(
            createSeasonDownloadRequest({
                tmdbId,
                seasonNumber: selectedSeasonNumber,
                seriesName: tvShow.name,
                torrent
            })
        );

        setShowSeasonTorrents(false);
        onClose();
    }, [tvShow, tmdbId, selectedSeasonNumber, seasonDownloadMutation, onClose]);

    const handleEpisodeDownload = useCallback(async (torrent: TorrentSearchResult) => {
        if (!tvShow || selectedSeasonNumber === null || selectedEpisodeNumber === null) return;

        await episodeDownloadMutation.mutateAsync(
            createEpisodeDownloadRequest({
                tmdbId,
                seasonNumber: selectedSeasonNumber,
                episodeNumber: selectedEpisodeNumber,
                seriesName: tvShow.name,
                torrent
            })
        );

        setShowEpisodeTorrents(false);
        onClose();
    }, [tvShow, tmdbId, selectedSeasonNumber, selectedEpisodeNumber, episodeDownloadMutation, onClose]);

    const handleCustomDownload = useCallback(async (torrent: TorrentSearchResult) => {
        if (!tvShow || selectedSeasonNumber === null) return;

        // Use season download for custom search
        await seasonDownloadMutation.mutateAsync(
            createSeasonDownloadRequest({
                tmdbId,
                seasonNumber: selectedSeasonNumber,
                seriesName: tvShow.name,
                torrent
            })
        );

        setShowCustomSearch(false);
        onClose();
    }, [tvShow, tmdbId, selectedSeasonNumber, seasonDownloadMutation, onClose]);

    const posterUrl = tvShow?.posterPath
        ? `https://image.tmdb.org/t/p/w342${tvShow.posterPath}`
        : undefined;

    const year = tvShow?.firstAirDate?.substring(0, 4);

    // Generate seasons array from numberOfSeasons
    const seasons = tvShow?.numberOfSeasons
        ? Array.from({ length: tvShow.numberOfSeasons }, (_, i) => i + 1)
        : [];

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
                <DialogTitle sx={{ pb: 0 }}>
                    {isLoadingTvShow ? 'Loading...' : tvShow?.name}
                </DialogTitle>

                <DialogContent>
                    {isLoadingTvShow ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : tvShow ? (
                        <>
                            <Box sx={{ display: 'flex', gap: 3, mt: 2, mb: 3 }}>
                                {/* Poster */}
                                <Box
                                    sx={{
                                        width: 150,
                                        flexShrink: 0,
                                        bgcolor: 'grey.800',
                                        borderRadius: 1,
                                        overflow: 'hidden'
                                    }}
                                >
                                    {posterUrl ? (
                                        <img
                                            src={posterUrl}
                                            alt={tvShow.name}
                                            style={{ width: '100%', display: 'block' }}
                                        />
                                    ) : (
                                        <Box sx={{ height: 225, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography color='text.secondary'>No Image</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Details */}
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        {year && (
                                            <Chip label={year} size='small' />
                                        )}
                                        {tvShow.numberOfSeasons && (
                                            <Chip label={`${tvShow.numberOfSeasons} Seasons`} size='small' variant='outlined' />
                                        )}
                                        {tvShow.voteAverage > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                                                <Typography variant='body2'>
                                                    {tvShow.voteAverage.toFixed(1)}
                                                </Typography>
                                            </Box>
                                        )}
                                        {tvShow.existsInLibrary && (
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label='In Library'
                                                size='small'
                                                color='success'
                                            />
                                        )}
                                    </Box>

                                    {tvShow.overview && (
                                        <Typography variant='body2' color='text.secondary'>
                                            {tvShow.overview}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Seasons */}
                            <Typography variant='h6' sx={{ mb: 1 }}>Seasons</Typography>
                            {seasons.map((seasonNumber) => (
                                <Accordion
                                    key={seasonNumber}
                                    expanded={expandedSeason === seasonNumber}
                                    onChange={() => handleSeasonExpand(seasonNumber)}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                            <Typography>Season {seasonNumber}</Typography>
                                            <Box sx={{ ml: 'auto', mr: 2 }}>
                                                <Tooltip title='Search Season Torrents'>
                                                    <IconButton
                                                        size='small'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSearchSeasonTorrents(seasonNumber);
                                                        }}
                                                    >
                                                        <DownloadIcon fontSize='small' />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {isLoadingSeason && expandedSeason === seasonNumber ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        ) : seasonDetails && expandedSeason === seasonNumber ? (
                                            <List dense>
                                                {seasonDetails.episodes?.map((episode) => (
                                                    <ListItem key={episode.id}>
                                                        <ListItemText
                                                            primary={`${episode.episodeNumber}. ${episode.name}`}
                                                            secondary={episode.airDate || 'TBA'}
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <Tooltip title='Search Episode Torrents'>
                                                                <IconButton
                                                                    size='small'
                                                                    onClick={() => handleSearchEpisodeTorrents(seasonNumber, episode.episodeNumber)}
                                                                >
                                                                    <DownloadIcon fontSize='small' />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography color='text.secondary'>
                                                Expand to load episodes
                                            </Typography>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            ))}

                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant='outlined'
                                    startIcon={<SearchIcon />}
                                    onClick={() => {
                                        setSelectedSeasonNumber(1);
                                        setShowCustomSearch(true);
                                    }}
                                >
                                    Custom Search
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <Typography color='error'>Failed to load TV show details</Typography>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Season Torrent Results Dialog */}
            <TorrentResultsDialog
                open={showSeasonTorrents}
                onClose={() => setShowSeasonTorrents(false)}
                title={`Season ${selectedSeasonNumber} Torrents - ${tvShow?.name || 'TV Show'}`}
                results={seasonTorrents || []}
                isLoading={isLoadingSeasonTorrents}
                isDownloading={seasonDownloadMutation.isPending}
                diskSpace={diskSpace}
                onDownload={handleSeasonDownload}
                onRefresh={() => refetchSeasonTorrents()}
            />

            {/* Episode Torrent Results Dialog */}
            <TorrentResultsDialog
                open={showEpisodeTorrents}
                onClose={() => setShowEpisodeTorrents(false)}
                title={`S${selectedSeasonNumber}E${selectedEpisodeNumber} Torrents - ${tvShow?.name || 'TV Show'}`}
                results={episodeTorrents || []}
                isLoading={isLoadingEpisodeTorrents}
                isDownloading={episodeDownloadMutation.isPending}
                diskSpace={diskSpace}
                onDownload={handleEpisodeDownload}
                onRefresh={() => refetchEpisodeTorrents()}
            />

            {/* Custom Search Dialog */}
            <CustomSearchDialog
                open={showCustomSearch}
                onClose={() => setShowCustomSearch(false)}
                defaultQuery={tvShow?.name || ''}
                category='tv'
                diskSpace={diskSpace}
                onDownload={handleCustomDownload}
            />
        </>
    );
};

export default DiscoveryTvShowDialog;
