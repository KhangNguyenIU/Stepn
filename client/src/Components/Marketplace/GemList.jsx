import React, { useContext, useState, useEffect } from 'react';
import { Attributes, Quality, SneakerType } from '../../Constants';
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

export default function GemList() {
  const { getListNFTsListingOnMarketplace, currentAccount, executeOffer } =
    useContext(MoveContext);
  const [listNft, setListNft] = React.useState([]);
  const [sneaker, setSneaker] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  // console.log(listNft);

  useEffect(() => {
    if (currentAccount) {
      getGemList();
    }
  }, [currentAccount]);

  const getGemList = async () => {
    const list = await getListNFTsListingOnMarketplace('gem');
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

  const GemCard = ({ gem, gemOffer, handleClickOpen, getGemList }) => {
    const onBuy = () => {
      // console.log({offer: sneakerOffer.id})
      executeOffer(
        gemOffer.id.toString(),
        gemOffer.price.toString(),
        'gem',
        getGemList
      );
    };

    return (
      <React.Fragment>
        <Typography variant="h5" sx={{ margin: 2 }}>
          {Quality[gem?.gem?.quality]}
        </Typography>
        <Typography>#{gem?.id.toString()}</Typography>
        <CardMedia
          component="img"
          height="160"
          image="https://m.stepn.com/images/items/100040.svg"
          onClick={() => handleClickOpen(sneaker)}
        />
        <p>{Attributes[gem?.attribute]}</p>
        <p>lv: {gem?.level}</p>
        <p>Price: {Number(gemOffer?.price) / 10 ** 18}</p>
        <Button onClick={onBuy}>Buy</Button>
      </React.Fragment>
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
                  <GemCard
                    gem={item.gem}
                    gemOffer={item.offerGem}
                    handleClickOpen={() => handleClickOpen(item.gem)}
                    getGemList={getGemList}
                  />
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>
    </React.Fragment>
  );
}
