import React, { type FunctionComponent, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import DownloadingIcon from '@mui/icons-material/Downloading';

import type { MissingEpisodeInfo } from '../types';
import { useMissingEpisodes } from '../api/useMissingEpisodes';
import TorrentSearchDialog from './TorrentSearchDialog';

interface MissingEpisodesListProps {
    seriesId: string;
}

const MissingEpisodesList: FunctionComponent<MissingEpisodesListProps> = ({ seriesId }) => {
    const { data: episodes, isLoading, error } = useMissingEpisodes(seriesId);
    const [searchEpisode, setSearchEpisode] = useState<MissingEpisodeInfo | null>(null);

    const handleSearchClick = useCallback((episode: MissingEpisodeInfo) => {
        setSearchEpisode(episode);
    }, []);

    const handleCloseSearch = useCallback(() => {
        setSearchEpisode(null);
    }, []);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return (
            <Typography color='error' sx={{ p: 2 }}>
                Failed to load missing episodes
            </Typography>
        );
    }

    if (!episodes || episodes.length === 0) {
        return (
            <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                No missing episodes found
            </Typography>
        );
    }

    return (
        <>
            <List dense>
                {episodes.map((episode) => (
                    <ListItem key={`${episode.seasonNumber}-${episode.episodeNumber}`}>
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        label={episode.episodeCode}
                                        size='small'
                                        color='primary'
                                        variant='outlined'
                                    />
                                    <Typography variant='body2'>
                                        {episode.episodeName || 'Unknown Episode'}
                                    </Typography>
                                </Box>
                            }
                            secondary={
                                episode.airDate
                                    ? `Aired: ${new Date(episode.airDate).toLocaleDateString()}`
                                    : 'Air date unknown'
                            }
                        />
                        <ListItemSecondaryAction>
                            {episode.hasActiveDownload ? (
                                <Tooltip title='Download in progress'>
                                    <DownloadingIcon color='primary' />
                                </Tooltip>
                            ) : (
                                <Tooltip title='Search torrents'>
                                    <IconButton
                                        edge='end'
                                        onClick={() => handleSearchClick(episode)}
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

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

export default MissingEpisodesList;
