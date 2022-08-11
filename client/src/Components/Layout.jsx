import React, { useState, useContext, useEffect } from 'react';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { Box } from '@mui/material';
import { MoveContext } from '../Context/MoveContext';

export default function Layout({ children }) {
  const { energy, balance, currentAccount, getFunc } = useContext(MoveContext);

  useEffect(() => {
    getFunc(test);
  }, []);

  const test = (message) => {
    console.log('function from layout ', message);
  };

  
  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ fontSize: '1.5rem', marginLeft: '2rem' }}>
          <Box>
            Energy : {energy.energy} / {energy.maxEnergy}
          </Box>

          <Box>GST : {balance.gst / 10 ** 18}</Box>
          <Box>GMT : {balance.gmt / 10 ** 18}</Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button href="/">Home</Button>

          <Button href="/inventory">Inventory</Button>

          <Button href="/marketplace">Marketplace</Button>
        </Box>
      </Box>
      {children}
    </React.Fragment>
  );
}
