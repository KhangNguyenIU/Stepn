import React, { useContext, useState, useEffect } from 'react';
import { Quality, SneakerType } from '../../Constants';
import { MoveContext } from '../../Context/MoveContext';
import InboxIcon from '@mui/icons-material/Inbox';
import {
  Box,
  Button,
  Card,
  CardMedia,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AddIcon from '@mui/icons-material/Add';

export default function SneakerList() {
  const { getListNFTsListingOnMarketplace, currentAccount, executeOffer } =
    useContext(MoveContext);
  const [listNft, setListNft] = React.useState([]);
  const [sneaker, setSneaker] = React.useState(null);
  const [open, setOpen] = React.useState(false);

    // console.log(listNft);

  useEffect(() => {
    if (currentAccount) {
      getSneakersList();
    }
  }, [currentAccount]);

  const getSneakersList = async () => {
    const list = await getListNFTsListingOnMarketplace('sneaker');
    console.log({ list });
    setListNft(list);
  };

  const handleClickOpen = (sneaker) => {
    setSneaker(sneaker);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSneaker(null);
  };

  const SneakerCard = ({ sneaker,sneakerOffer, handleClickOpen, getSneakersList }) => {
    const onBuy =()=>{
        // console.log({offer: sneakerOffer.id})
        executeOffer(sneakerOffer.id.toString(),sneakerOffer.price.toString(), 'sneaker',getSneakersList)
    }

    return (
      <React.Fragment>
        <Typography variant="h5" sx={{ margin: 2 }}>
          {Quality[sneaker?.sneaker?.quality]}
        </Typography>
        <Typography>
            #{sneaker?.id.toString()}
        </Typography>
        <CardMedia
          component="img"
          height="160"
          image="https://res.stepn.com/imgOut/16/33/m21870b_8696e2e12eff86c52d8896fff152ff87c42c_67.png"
          onClick={()=>handleClickOpen(sneaker)}
        />
        <p>{SneakerType[sneaker?.sneakerType]}</p>
        <p>lv: {sneaker?.level}</p>
         <p>Price: {Number(sneakerOffer?.price)/10**18}</p> 
        <Button onClick={onBuy}>Buy</Button>
      </React.Fragment>
    );
  };

  const SneakerModal = ({ sneaker, open, handleClose }) => {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        scroll="body"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">
          sneaker# {sneaker?.id.toString()}
        </DialogTitle>
        <DialogContent dividers={scroll === 'body'}>
          <Stack spacing={2}>
            <Typography>Level: {sneaker?.level}</Typography>
            <Typography>Quality: {Quality[sneaker?.quality]}</Typography>
            <Typography>
              SneakerType: {SneakerType[sneaker?.sneakerType]}
            </Typography>
            <Typography>
              Speed: {sneaker?.speed[0]} - {sneaker?.speed[1]} (km/h)
            </Typography>
            <Typography>Durability : {sneaker?.durability}</Typography>
            <Typography>Hp : {sneaker?.hp}</Typography>
            <Typography>Shoe Mint: {sneaker?.mintCount} /7</Typography>
            <Typography sx={{ display: 'flex' }}>
              <IconButton>
                <AddIcon />
              </IconButton>

              <IconButton>
                <AddIcon />
              </IconButton>

              <IconButton>
                <AddIcon />
              </IconButton>

              <IconButton>
                <AddIcon />
              </IconButton>
            </Typography>

            <Typography>
              Efficiency :{' '}
              {Number(sneaker?.attributes?.efficiency.toString()) / 10 ** 10}
            </Typography>

            <Typography>
              Luck : {Number(sneaker?.attributes?.luck.toString()) / 10 ** 10}
            </Typography>
            <Typography>
              Comfort:{' '}
              {Number(sneaker?.attributes?.comfort.toString()) / 10 ** 10}
            </Typography>
            <Typography>
              reslience :
              {Number(sneaker?.attributes?.resilience.toString()) / 10 ** 10}
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  };
  return (
    <React.Fragment>
      <Box sx={{ width: '100%' }}>
        <Grid container spacing={2}>
          {!!listNft?.length &&
            listNft.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1px',
                    cursor: 'pointer',
                  }}
                >
                  <SneakerCard
                    sneaker={item.sneaker}
                    sneakerOffer = {item.offerSneaker}
                    handleClickOpen={() => handleClickOpen(item.sneaker)}
                    getSneakersList={getSneakersList}
                  />
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>
      <SneakerModal sneaker={sneaker} open={open} handleClose={handleClose} />
    </React.Fragment>
  );
}
