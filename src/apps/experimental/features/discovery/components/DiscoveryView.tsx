import React, { type FC, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import Pagination from '@mui/material/Pagination';

import {
    useTrendingMovies,
    usePopularMovies,
    useSearchMovies,
    useTrendingTvShows,
    usePopularTvShows,
    useSearchTvShows
} from '../api/useDiscoveryApi';
import type { DiscoveryMovie, DiscoveryTvShow, DiscoveryViewMode } from '../types';
import DiscoveryCard from './DiscoveryCard';
import DiscoveryMovieDialog from './DiscoveryMovieDialog';
import DiscoveryTvShowDialog from './DiscoveryTvShowDialog';

interface DiscoveryViewProps {
    category: 'movies' | 'tvshows';
}

const DiscoveryView: FC<DiscoveryViewProps> = ({ category }) => {
    const [viewMode, setViewMode] = useState<DiscoveryViewMode>('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [page, setPage] = useState(1);

    // Movie dialog state
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

    // TV show dialog state
    const [selectedTvShowId, setSelectedTvShowId] = useState<number | null>(null);

    // Movie queries
    const { data: trendingMovies, isLoading: isLoadingTrendingMovies } = useTrendingMovies(page);
    const { data: popularMovies, isLoading: isLoadingPopularMovies } = usePopularMovies(page);
    const { data: searchedMovies, isLoading: isLoadingSearchMovies } = useSearchMovies(activeSearch, undefined, page);

    // TV show queries
    const { data: trendingTvShows, isLoading: isLoadingTrendingTvShows } = useTrendingTvShows(page);
    const { data: popularTvShows, isLoading: isLoadingPopularTvShows } = usePopularTvShows(page);
    const { data: searchedTvShows, isLoading: isLoadingSearchTvShows } = useSearchTvShows(activeSearch, undefined, page);

    const handleViewModeChange = useCallback((_: React.MouseEvent<HTMLElement>, newMode: DiscoveryViewMode | null) => {
        if (newMode) {
            setViewMode(newMode);
            setPage(1);
            if (newMode !== 'search') {
                setActiveSearch('');
                setSearchQuery('');
            }
        }
    }, []);

    const handleSearch = useCallback(() => {
        if (searchQuery.length >= 2) {
            setActiveSearch(searchQuery);
            setViewMode('search');
            setPage(1);
        }
    }, [searchQuery]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    const handleMovieClick = useCallback((movie: DiscoveryMovie) => {
        setSelectedMovieId(movie.id);
    }, []);

    const handleTvShowClick = useCallback((tvShow: DiscoveryTvShow) => {
        setSelectedTvShowId(tvShow.id);
    }, []);

    const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    }, []);

    // Determine which data to display based on category and view mode
    let items: (DiscoveryMovie | DiscoveryTvShow)[] = [];
    let isLoading = false;
    let totalPages = 1;

    if (category === 'movies') {
        if (viewMode === 'trending') {
            items = trendingMovies?.results || [];
            isLoading = isLoadingTrendingMovies;
            totalPages = trendingMovies?.totalPages || 1;
        } else if (viewMode === 'popular') {
            items = popularMovies?.results || [];
            isLoading = isLoadingPopularMovies;
            totalPages = popularMovies?.totalPages || 1;
        } else {
            items = searchedMovies?.results || [];
            isLoading = isLoadingSearchMovies;
            totalPages = searchedMovies?.totalPages || 1;
        }
    } else {
        if (viewMode === 'trending') {
            items = trendingTvShows?.results || [];
            isLoading = isLoadingTrendingTvShows;
            totalPages = trendingTvShows?.totalPages || 1;
        } else if (viewMode === 'popular') {
            items = popularTvShows?.results || [];
            isLoading = isLoadingPopularTvShows;
            totalPages = popularTvShows?.totalPages || 1;
        } else {
            items = searchedTvShows?.results || [];
            isLoading = isLoadingSearchTvShows;
            totalPages = searchedTvShows?.totalPages || 1;
        }
    }

    // Limit total pages to 500 (TMDB limit)
    totalPages = Math.min(totalPages, 500);

    return (
        <Box sx={{ p: 2 }}>
            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    size='small'
                >
                    <ToggleButton value='trending'>
                        <TrendingUpIcon sx={{ mr: 0.5 }} />
                        Trending
                    </ToggleButton>
                    <ToggleButton value='popular'>
                        <StarIcon sx={{ mr: 0.5 }} />
                        Popular
                    </ToggleButton>
                </ToggleButtonGroup>

                <TextField
                    size='small'
                    placeholder={`Search ${category === 'movies' ? 'movies' : 'TV shows'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    sx={{ minWidth: 250 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position='end'>
                                <IconButton
                                    onClick={handleSearch}
                                    disabled={searchQuery.length < 2}
                                    size='small'
                                >
                                    <SearchIcon />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                {viewMode === 'search' && activeSearch && (
                    <Typography variant='body2' color='text.secondary'>
                        Results for &quot;{activeSearch}&quot;
                    </Typography>
                )}
            </Box>

            {/* Content */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : items.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography color='text.secondary'>
                        {viewMode === 'search'
                            ? `No ${category === 'movies' ? 'movies' : 'TV shows'} found`
                            : `No ${viewMode} ${category === 'movies' ? 'movies' : 'TV shows'} available`}
                    </Typography>
                </Box>
            ) : (
                <>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            justifyContent: { xs: 'center', sm: 'flex-start' }
                        }}
                    >
                        {items.map((item) => (
                            <DiscoveryCard
                                key={item.id}
                                item={item}
                                type={category === 'movies' ? 'movie' : 'tvshow'}
                                onClick={() =>
                                    category === 'movies'
                                        ? handleMovieClick(item as DiscoveryMovie)
                                        : handleTvShowClick(item as DiscoveryTvShow)
                                }
                            />
                        ))}
                    </Box>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color='primary'
                                size='large'
                            />
                        </Box>
                    )}
                </>
            )}

            {/* Movie Detail Dialog */}
            {selectedMovieId && (
                <DiscoveryMovieDialog
                    open={selectedMovieId !== null}
                    onClose={() => setSelectedMovieId(null)}
                    tmdbId={selectedMovieId}
                />
            )}

            {/* TV Show Detail Dialog */}
            {selectedTvShowId && (
                <DiscoveryTvShowDialog
                    open={selectedTvShowId !== null}
                    onClose={() => setSelectedTvShowId(null)}
                    tmdbId={selectedTvShowId}
                />
            )}
        </Box>
    );
};

export default DiscoveryView;
