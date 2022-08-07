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

export default function MintingScrollList() {
  const { getListNFTsOfaUser, currentAccount } = useContext(MoveContext);
  const [listNft, setListNft] = React.useState([]);

  useEffect(() => {
    if (currentAccount) {
    //   (async () => {
    //     const list = await getListNFTsOfaUser('mintingScroll');
    //     setListNft(list);
    //   })();
    getMSList()
    }
  }, [currentAccount]);


  const getMSList = async ()=>{
    const list = await getListNFTsOfaUser('mintingScroll');
    setListNft(list);
  }

  const MSCard = ({ ms,getMSList }) => {
    const [price, setPrice] = useState(0);
    const { makeOffer } = useContext(MoveContext);

    const handleChange = (event) => {
      setPrice(event.target.value);
    };

    const onSell = () => {
      if (Number(price) <= 0) {
        return;
      }
      makeOffer(ms?.id.toString(), String(Number(price) * 10 ** 18), 'mintingScroll',getMSList);
    };
    return (
      <React.Fragment>
        <Typography variant="h5" sx={{ margin: 1 }}>
          {Quality[ms.quality]}
        </Typography>
        <Typography>
            #{ms.id.toString()}
        </Typography>
        <CardMedia
          component="img"
          height="160"
          image="https://m.stepn.com/images/items/7011001.png"
        />
        <TextField type="number" onChange={handleChange} sx={{marginTop:3}}></TextField>
        <Button onClick={onSell}>Sell</Button>
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {!!listNft?.length &&
          listNft.map((ms, index) => (
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
                <MSCard ms={ms} getMSList={getMSList} />
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
