import React, { type FC, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

import type { DiscoveryMovie, DiscoveryTvShow } from '../types';
import { useAddFavorite, useRemoveFavorite } from '../api/useDiscoveryFavorites';

interface DiscoveryCardProps {
    item: DiscoveryMovie | DiscoveryTvShow;
    type: 'movie' | 'tvshow';
    imageBaseUrl?: string;
    onClick: () => void;
}

const DiscoveryCard: FC<DiscoveryCardProps> = ({
    item,
    type,
    imageBaseUrl = 'https://image.tmdb.org/t/p/w342',
    onClick
}) => {
    const addFavoriteMutation = useAddFavorite();
    const removeFavoriteMutation = useRemoveFavorite();

    const title = type === 'movie'
        ? (item as DiscoveryMovie).title
        : (item as DiscoveryTvShow).name;

    const year = type === 'movie'
        ? (item as DiscoveryMovie).releaseDate?.substring(0, 4)
        : (item as DiscoveryTvShow).firstAirDate?.substring(0, 4);

    const posterUrl = item.posterPath
        ? `${imageBaseUrl}${item.posterPath}`
        : undefined;

    const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        const movieItem = type === 'movie' ? (item as DiscoveryMovie) : null;
        const tvItem = type === 'tvshow' ? (item as DiscoveryTvShow) : null;

        if (item.isFavorite) {
            removeFavoriteMutation.mutate({
                tmdbId: item.id,
                mediaType: type
            });
        } else {
            addFavoriteMutation.mutate({
                tmdbId: item.id,
                mediaType: type,
                title,
                posterPath: item.posterPath || undefined,
                year: year ? parseInt(year, 10) : undefined
            });
        }
    }, [item, type, title, year, addFavoriteMutation, removeFavoriteMutation]);

    return (
        <Card
            sx={{
                width: 154,
                flexShrink: 0,
                position: 'relative',
                bgcolor: 'background.paper',
                '&:hover': {
                    transform: 'scale(1.02)',
                    transition: 'transform 0.2s ease-in-out'
                }
            }}
        >
            <CardActionArea onClick={onClick}>
                <CardMedia
                    component='div'
                    sx={{
                        height: 231,
                        bgcolor: 'grey.800',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundImage: posterUrl ? `url(${posterUrl})` : undefined,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {!posterUrl && (
                        <Typography variant='caption' color='text.secondary'>
                            No Image
                        </Typography>
                    )}
                </CardMedia>
                <Box sx={{ p: 1 }}>
                    <Typography
                        variant='body2'
                        noWrap
                        sx={{ fontWeight: 500 }}
                        title={title}
                    >
                        {title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {year && (
                            <Typography variant='caption' color='text.secondary'>
                                {year}
                            </Typography>
                        )}
                        {item.voteAverage > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 'auto' }}>
                                <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                <Typography variant='caption' color='text.secondary'>
                                    {item.voteAverage.toFixed(1)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </CardActionArea>

            {/* In Library indicator */}
            {item.existsInLibrary && (
                <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                    label='In Library'
                    size='small'
                    color='success'
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        height: 22,
                        '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                        '& .MuiChip-icon': { ml: 0.5 }
                    }}
                />
            )}

            {/* Favorite button */}
            <IconButton
                onClick={handleFavoriteClick}
                size='small'
                sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.8)'
                    }
                }}
            >
                {item.isFavorite ? (
                    <FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} />
                ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 18, color: 'white' }} />
                )}
            </IconButton>
        </Card>
    );
};

export default DiscoveryCard;
