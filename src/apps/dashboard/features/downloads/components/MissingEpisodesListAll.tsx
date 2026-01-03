import React, { type FunctionComponent, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import DownloadingIcon from '@mui/icons-material/Downloading';

import type { MissingEpisodeInfo } from '../types';
import { useAllMissingEpisodes } from '../api/useMissingEpisodes';
import TorrentSearchDialog from './TorrentSearchDialog';

const MissingEpisodesListAll: FunctionComponent = () => {
    const { data: episodes, isLoading, error } = useAllMissingEpisodes(50);
    const [searchEpisode, setSearchEpisode] = useState<MissingEpisodeInfo | null>(null);

    const handleSearchClick = useCallback((episode: MissingEpisodeInfo) => {
        setSearchEpisode(episode);
    }, []);

    const handleCloseSearch = useCallback(() => {
        setSearchEpisode(null);
    }, []);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Typography color='error' sx={{ p: 2 }}>
                Failed to load missing episodes. Make sure the Media Acquisition feature is enabled.
            </Typography>
        );
    }

    if (!episodes || episodes.length === 0) {
        return (
            <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                No missing episodes found. Your library is complete!
            </Typography>
        );
    }

    // Group by series
    const groupedBySeries = episodes.reduce((acc, episode) => {
        if (!acc[episode.seriesId]) {
            acc[episode.seriesId] = {
                seriesName: episode.seriesName,
                episodes: []
            };
        }
        acc[episode.seriesId].episodes.push(episode);
        return acc;
    }, {} as Record<string, { seriesName: string; episodes: MissingEpisodeInfo[] }>);

    return (
        <>
            {Object.entries(groupedBySeries).map(([seriesId, { seriesName, episodes: seriesEpisodes }]) => (
                <Card key={seriesId} sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant='h6' gutterBottom>
                            {seriesName}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {seriesEpisodes.map((episode) => (
                                <Box
                                    key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        p: 1,
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        backgroundColor: 'background.paper'
                                    }}
                                >
                                    <Chip
                                        label={episode.episodeCode}
                                        size='small'
                                        color='primary'
                                        variant='outlined'
                                    />
                                    <Typography variant='body2' sx={{ maxWidth: 200 }} noWrap title={episode.episodeName || ''}>
                                        {episode.episodeName || 'Unknown'}
                                    </Typography>
                                    {episode.hasActiveDownload ? (
                                        <Tooltip title='Download in progress'>
                                            <DownloadingIcon color='primary' fontSize='small' />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title='Search torrents'>
                                            <IconButton
                                                size='small'
                                                onClick={() => handleSearchClick(episode)}
                                            >
                                                <SearchIcon fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            ))}

            {searchEpisode && (
                <TorrentSearchDialog
                    open={!!searchEpisode}
                    onClose={handleCloseSearch}
                    episode={searchEpisode}
                />
            )}
        </>
    );
};

export default MissingEpisodesListAll;
