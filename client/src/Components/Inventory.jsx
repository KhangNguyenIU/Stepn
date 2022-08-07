import React, { useContext, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Card, CardMedia, Container, Grid, Typography } from '@mui/material';
import { MoveContext } from '../Context/MoveContext';
import { Quality, SnkearType } from '../Constants';
import SneakerList from './Inventory/SneakerList';
import GemList from './Inventory/GemList';
import MintingScrollList from './Inventory/MintingScrollList';
import Layout from './Layout';
import ShoeBoxList from './Inventory/ShoeBoxList';
import MysteryBoxList from './Inventory/MysteryBoxList';

export default function Inventory() {
  const [value, setValue] = React.useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ width: '100%', typography: 'body1' }}>
          <Typography variant="h1"> Your inventory</Typography>
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList
                onChange={handleChange}
                aria-label="lab API tabs example"
                centered
              >
                <Tab label="Sneaker" value="1" />
                <Tab label="Gem" value="2" />
                <Tab label="Minting Scroll" value="3" />
                <Tab label="Shoe Box" value="4" />
                <Tab label="Mystery Box" value="5" />
              </TabList>
            </Box>
            <TabPanel value="1">
              <SneakerList />
            </TabPanel>
            <TabPanel value="2">
              <GemList />
            </TabPanel>
            <TabPanel value="3">
              <MintingScrollList />
            </TabPanel>
            <TabPanel value="4">
              <ShoeBoxList />
            </TabPanel>
            <TabPanel value="5">
                <MysteryBoxList/>
            </TabPanel>
          </TabContext>
        </Box>
      </Container>
    </Layout>
  );
}
