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

export default function GemList() {
  const { getListNFTsOfaUser, currentAccount, combine } =
    useContext(MoveContext);
  const [listNft, setListNft] = React.useState([]);
  const [combineInput, setCombineInput] = useState('');

  useEffect(() => {
    if (currentAccount) {
      getGemsList();
    }
  }, [currentAccount]);

  const handleChangeCombineInput = (event) => {
    setCombineInput(event.target.value);
  };

  const onCombine = () => {
    let arr = combineInput.split(',');
    combine(arr, getGemsList);
  };

  const getGemsList = async () => {
    const list = await getListNFTsOfaUser('gem');
    setListNft(list);
  };

  const GemCard = ({ gem, getGemsList }) => {
    const { makeOffer } = useContext(MoveContext);

    const [price, setPrice] = useState(0);

    const handleChangePrice = (event) => {
      setPrice(event.target.value);
    };
    const onSell = () => {
      if (Number(price) <= 0) {
        return;
      }
      console.log({ gem: gem?.id });
      makeOffer(
        gem?.id.toString(),
        String(Number(price) * 10 ** 18),
        'gem',
        getGemsList
      );
    };

    return (
      <React.Fragment>
        <Typography variant="h5" sx={{ margin: 2 }}>
          {Attributes[gem.attribute]}
        </Typography>

        <Typography>#{gem.id.toString()}</Typography>
        <CardMedia
          component="img"
          height="160"
          image="https://m.stepn.com/images/items/100040.svg"
        />
        <Typography>Level: {gem.level}</Typography>
        <Typography>Attribute: +{gem.baseAttribute} %</Typography>
        <Typography>Effect: + {gem.effectAttribute} %</Typography>
        <TextField type="number" onChange={handleChangePrice}></TextField>
        <Button onClick={onSell}>Sell</Button>
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography>Combine Gem</Typography>
      <TextField onChange={handleChangeCombineInput} />
      <Button onClick={onCombine}>Combine</Button>
      <Grid container spacing={2}>
        {!!listNft?.length &&
          listNft.map((gem, index) => (
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
                <GemCard gem={gem} getGemsList={getGemsList} />
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
