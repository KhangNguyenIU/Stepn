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

export default function ShoeBoxList() {
  const { getListNFTsListingOnMarketplace, currentAccount, executeOffer } =
    useContext(MoveContext);
  const [listNft, setListNft] = React.useState([]);
  const [sneaker, setSneaker] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  console.log(listNft);

  useEffect(() => {
    if (currentAccount) {
      getShoeBoxList();
    }
  }, [currentAccount]);

  const getShoeBoxList = async () => {
    const list = await getListNFTsListingOnMarketplace('shoeBox');
    // console.log({ list });
    setListNft(list);
  };

  const ShoeBoxCard = ({ shoeBox, shoeBoxOffer, getShoeBoxList }) => {
    console.log({shoeBox, shoeBoxOffer });

    const onBuy = () => {
      executeOffer(
        shoeBoxOffer.id.toString(),
        shoeBoxOffer.price.toString(),
        'shoeBox',
        getShoeBoxList
      );
    };

    return (
      <React.Fragment>
        <Typography variant="h5" sx={{ margin: 2 }}>
          {Quality[shoeBox?.quality]}
        </Typography>
        <Typography>#{shoeBox?.id.toString()}</Typography>
        <CardMedia
          component="img"
          height="160"
          image="https://m.stepn.com/images/items/100003.png"
          onClick={() => handleClickOpen(sneaker)}
        />
        <Typography>{Quality[shoeBox.quality]}</Typography>
        <Typography> {SneakerType[shoeBox.sneakerType]} </Typography>
        <Typography>
          Mint from : #{shoeBox.parentSneaker1.toString()}
        </Typography>
        <Typography>Mint from: #{shoeBox.parentSneaker2.toString()}</Typography>
        <p>Price: {Number(shoeBoxOffer?.price) / 10 ** 18}</p>
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
                  <ShoeBoxCard
                    shoeBox={item.shoeBox}
                    shoeBoxOffer={item.offerShoeBox}
                    handleClickOpen={() => handleClickOpen(item.shoeBox)}
                    getShoeBoxList={getShoeBoxList}
                  />
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>
    </React.Fragment>
  );
}
