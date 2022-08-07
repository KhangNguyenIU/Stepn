import { Backdrop, CircularProgress } from '@mui/material';
import React from 'react';
import { useContext } from 'react';
import { MoveContext } from '../Context/MoveContext';

export default function Loading() {
  const { loading } = useContext(MoveContext);
  return (
    <React.Fragment>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </React.Fragment>
  );
}
