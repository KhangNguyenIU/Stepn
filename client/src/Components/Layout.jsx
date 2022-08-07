import React, {useState, useContext, useEffect } from 'react';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { Box } from '@mui/material';
import { MoveContext } from '../Context/MoveContext';

export default function Layout({ children }) {
  const { energy,balance, currentAccount } = useContext(MoveContext);

  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ fontSize: '1.5rem', marginLeft: '2rem' }}>
          <Box>
            Energy : {energy.energy} / {energy.maxEnergy}
          </Box>

          <Box>
            Balance : {balance/10**18}
          </Box>
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
