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
import { timeLeft } from '../../utils';

export default function MysteryBoxList() {
  const { currentAccount, getListMysteryBoxOfUser } = useContext(MoveContext);
  const [listNft, setListNft] = React.useState([]);

  useEffect(() => {
    if (currentAccount) {
      getMysteryBoxList();
    }
  }, [currentAccount]);

  const getMysteryBoxList = async () => {
    const mysBoxList = await getListMysteryBoxOfUser(currentAccount);
    console.log({ mysBoxList });
    setListNft(mysBoxList);
  };

  const MysteryBoxCard = ({ mysBox, getMysteryBoxList }) => {
    const { openMysteryBox } = useContext(MoveContext);
    const onOpenMysteryBox = () => {
      openMysteryBox(mysBox.id.toString(), getMysteryBoxList);
    };
    return (
      <React.Fragment>
        <Typography variant="h5" sx={{ margin: 2 }}>
          {Attributes[mysBox.attribute]}
        </Typography>

        <Typography>#{mysBox.id.toString()}</Typography>
        <CardMedia
          component="img"
          height="160"
          image="https://cf.shopee.vn/file/83bad52a9fdd906504af3ef4cc0c55b0"
        />
        <Typography>
          Cool down: {timeLeft(parseInt(mysBox.coolDown))} s
        </Typography>

        <Button
          disabled={timeLeft(parseInt(mysBox.coolDown)) !== 0}
          onClick={onOpenMysteryBox}
        >
          Open
        </Button>
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {!!listNft?.length &&
          listNft.map((mysBox, index) => (
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
                <MysteryBoxCard
                  mysBox={mysBox}
                  getMysteryBoxList={getMysteryBoxList}
                />
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
