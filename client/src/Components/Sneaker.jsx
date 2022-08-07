import { Container } from '@mui/material';
import React from 'react';

export default function Sneaker({ sneaker }) {
  return (
    <Container>
      <Box
        sxx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h3" sx={{ margin: 2 }} >
            {sneaker.id}
        </Typography>
        <Typography variant="h4" sx={{ margin: 2 }} >
            {sneaker.quality}
        </Typography>
        <Typography variant="h4" sx={{ margin: 2 }} >
            {sneaker.quality}
        </Typography>
      </Box>
    </Container>
  );
}
