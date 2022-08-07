import React, { useContext } from 'react';
import Container from '@mui/material/Container';
import { MoveContext } from '../Context/MoveContext';
import { Button } from '@mui/material';

export default function Home() {
  const { currentAccount, connectWallet } = useContext(MoveContext);
  return (
    <div>
      <Container maxWidth="md">
        <h1>{currentAccount}</h1>
        {
            !currentAccount && (
                <Button onClick={connectWallet}>
                    Connect Wallet
                </Button>
            )
        }
      </Container>
    </div>
  );
}
