import React, { type FunctionComponent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';

import Page from 'components/Page';
import DownloadsList from '../../features/downloads/components/DownloadsList';
import { useAllMissingEpisodes } from '../../features/downloads/api/useMissingEpisodes';
import MissingEpisodesListAll from '../../features/downloads/components/MissingEpisodesListAll';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: FunctionComponent<TabPanelProps> = ({ children, value, index, ...other }) => {
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`downloads-tabpanel-${index}`}
            aria-labelledby={`downloads-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
        </div>
    );
};

export const Component: FunctionComponent = () => {
    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Page
            id='downloadsPage'
            title='Downloads'
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant='h4' component='h1'>
                        Media Acquisition
                    </Typography>
                </Box>

                <Paper sx={{ mb: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label='downloads tabs'>
                        <Tab label='Active Downloads' id='downloads-tab-0' aria-controls='downloads-tabpanel-0' />
                        <Tab label='Missing Episodes' id='downloads-tab-1' aria-controls='downloads-tabpanel-1' />
                    </Tabs>
                </Paper>

                <TabPanel value={tabValue} index={0}>
                    <DownloadsList />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <MissingEpisodesListAll />
                </TabPanel>
            </Box>
        </Page>
    );
};

Component.displayName = 'DownloadsPage';
