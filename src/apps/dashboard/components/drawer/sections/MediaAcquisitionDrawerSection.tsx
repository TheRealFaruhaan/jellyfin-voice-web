import Download from '@mui/icons-material/Download';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';

import ListItemLink from 'components/ListItemLink';

const MediaAcquisitionDrawerSection = () => {
    return (
        <List
            aria-labelledby='media-acquisition-subheader'
            subheader={
                <ListSubheader component='div' id='media-acquisition-subheader'>
                    Media Acquisition
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/downloads'>
                    <ListItemIcon>
                        <Download />
                    </ListItemIcon>
                    <ListItemText primary='Downloads' />
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default MediaAcquisitionDrawerSection;
