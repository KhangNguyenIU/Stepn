import {
  Box,
  Button,
  Card,
  CardMedia,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import React, { useContext, useState, useEffect } from 'react';
import { Attributes, Quality, SneakerType } from '../../Constants';
import { MoveContext } from '../../Context/MoveContext';

export default function ShoeBoxList() {
  const { getListNFTsOfaUser, currentAccount, combine , mintShoeBox} =
    useContext(MoveContext);
  const [listNft, setListNft] = React.useState([]);
  const [mintInfo, setMintInfo] = useState('');

  const handleChangeMintInfo = (event) => {
    setMintInfo(event.target.value);
  };
  const onMintShoeBox = () => {
    let temp = mintInfo.split(',')
    mintShoeBox(temp[0], temp[1], temp[2], temp[3], getShoeBoxList)
  };

  useEffect(() => {
    if (currentAccount) {
      getShoeBoxList();
    }
  }, [currentAccount]);

  const getShoeBoxList = async () => {
    const list = await getListNFTsOfaUser('shoebox');
    setListNft(list);
  };

  const ShoeBoxCard = ({ shoeBox, getShoeBoxList }) => {
    const { makeOffer, openShoeBox } = useContext(MoveContext);
    const [price, setPrice] = useState(0);


    const handleChangePrice = (event) => {
      setPrice(event.target.value);
    };

    const onOpenShoeBox = () => {
      openShoeBox(shoeBox.id.toString(), getShoeBoxList);
    };

    const onSell = () => {
      if (Number(price) <= 0) {
        return;
      }
      makeOffer(
        shoeBox?.id.toString(),
        String(Number(price) * 10 ** 18),
        'shoeBox',
        getShoeBoxList
      );
    };

    return (
      <React.Fragment>
        <Typography>#{shoeBox.id.toString()}</Typography>
        <CardMedia
          component="img"
          height="160"
          image="https://m.stepn.com/images/items/100003.png"
        />
        <Typography>{Quality[shoeBox.quality]}</Typography>
        <Typography> {SneakerType[shoeBox.sneakerType]} </Typography>
        <Typography>
          Mint from : #{shoeBox.parentSneaker1.toString()}
        </Typography>
        <Typography>Mint from: #{shoeBox.parentSneaker2.toString()}</Typography>
        <Button onClick={onOpenShoeBox}>Open</Button>
        <TextField type="number" onChange={handleChangePrice}></TextField>
        <Button onClick={onSell}>Sell</Button>
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField placeholder="" onChange={handleChangeMintInfo} />
      <Button onClick={onMintShoeBox}>Mint</Button>
      <Grid container spacing={2}>
        {!!listNft?.length &&
          listNft.map((shoeBox, index) => (
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
                  shoeBox={shoeBox}
                  getShoeBoxList={getShoeBoxList}
                />
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
