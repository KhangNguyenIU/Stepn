import React, { useContext, useState, useEffect } from 'react';
import { Quality, SneakerType } from '../../Constants';
import { MoveContext } from '../../Context/MoveContext';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  Card,
  CardMedia,
  Divider,
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
  const { getListNFTsOfaUser, currentAccount, equipGem } =
    useContext(MoveContext);
  const [listNft, setListNft] = React.useState([]);
  const [sneaker, setSneaker] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  const [equipInfo, setEquipInfo] = useState('');

  useEffect(() => {
    if (currentAccount) {
      getSneakersList();
    }
  }, [currentAccount]);

  const handleChangeEquipInfo = (event) => setEquipInfo(event.target.value);

  const onEquipGem = () => {
    let temp = equipInfo.split(',');

    equipGem(temp[0], temp[1], temp[2], getSneakersList);
  };

  const getSneakersList = async () => {
    const list = await getListNFTsOfaUser('sneaker');
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

  const SneakerCard = ({ sneaker, handleClickOpen, getSneakersList }) => {
    const { makeOffer, move2Earn, levelUpSneaker } = useContext(MoveContext);

    const [price, setPrice] = useState(0);
    const [runTime, setRunTime] = useState(0);
    const [runSpeed, setRunSpeed] = useState(0);

    const handleChangePrice = (event) => {
      setPrice(event.target.value);
    };

    const handleChangeRunTime = (event) => {
      setRunTime(event.target.value);
    };

    const handleChangeRunSpeed = (event) => {
      setRunSpeed(event.target.value);
    };

    const onLevelUp = () => {
      levelUpSneaker(sneaker.id.toString(), getSneakersList);
    };

    const onSell = () => {
      if (Number(price) <= 0) {
        return;
      }
      makeOffer(
        sneaker?.id,
        String(Number(price) * 10 ** 18),
        'sneaker',
        getSneakersList
      );
    };

    const onMove = () => {
      if (Number(runTime) <= 0 || Number(runSpeed) <= 0) return;
      move2Earn(sneaker?.id.toString(), Number(runSpeed), Number(runTime));
    };

    return (
      <React.Fragment>
        <Typography variant="h5" sx={{ margin: 1 }}>
          {Quality[sneaker.quality]}
        </Typography>

        <Typography># {sneaker.id.toString()}</Typography>

        <CardMedia
          component="img"
          height="160"
          image="https://res.stepn.com/imgOut/16/33/m21870b_8696e2e12eff86c52d8896fff152ff87c42c_67.png"
          onClick={handleClickOpen}
        />
        <p>{SneakerType[sneaker.sneakerType]}</p>
        <p>lv: {sneaker.level}</p>
        <p>
          Speed: {sneaker.speed[0]} - {sneaker.speed[1]} (km/h)
        </p>
        <TextField
          type="number"
          onChange={handleChangePrice}
          placeholder="Price"
        ></TextField>

        <Button onClick={onSell}>Sell</Button>

        <Divider />

        <TextField
          type="number"
          sx={{ marginTop: '1rem' }}
          placeholder="Run duration (minute)"
          onChange={handleChangeRunTime}
        ></TextField>

        <TextField
          type="number"
          sx={{ marginTop: '1rem' }}
          placeholder="Speed (km/h)"
          onChange={handleChangeRunSpeed}
        ></TextField>

        <Button onClick={onMove}>Run</Button>

        <Divider />
        <Button onClick={onLevelUp}>Level up</Button>
      </React.Fragment>
    );
  };

  const SneakerModal = ({ sneaker, open, handleClose, getSneakersList }) => {
    const { repairSneaker } = useContext(MoveContext);

    const onRepair = () => {
      repairSneaker(sneaker.id.toString(), getSneakersList);
    };
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

            <Box>
              <IconButton
                onClick={onRepair}
                disabled={sneaker?.durability === 100 && sneaker?.hp === 100}
              >
                <RefreshIcon />
              </IconButton>
            </Box>

            <Typography sx={{ fontWeight: 'bold' }}>Gems</Typography>
            <Typography sx={{ display: 'flex' }}>
              {sneaker?.sockets[0]?.toString() === '0' ? (
                <IconButton>
                  <AddIcon />
                </IconButton>
              ) : (
                <IconButton>{sneaker?.sockets[0].toString()}</IconButton>
              )}

              {sneaker?.sockets[1]?.toString() === '0' ? (
                <IconButton>
                  <AddIcon />
                </IconButton>
              ) : (
                <IconButton>{sneaker?.sockets[1].toString()}</IconButton>
              )}

              {sneaker?.sockets[2]?.toString() === '0' ? (
                <IconButton>
                  <AddIcon />
                </IconButton>
              ) : (
                <IconButton>{sneaker?.sockets[2].toString()}</IconButton>
              )}

              {sneaker?.sockets[3]?.toString() === '0' ? (
                <IconButton>
                  <AddIcon />
                </IconButton>
              ) : (
                <IconButton>{sneaker?.sockets[3].toString()}</IconButton>
              )}
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
        <Typography>Equip gem for sneaker#</Typography>
        <TextField
          onChange={handleChangeEquipInfo}
          placeholder="Input sneaker id, gem id, slot id"
        ></TextField>
        <Button onClick={onEquipGem}>Equip</Button>
        <Grid container spacing={2}>
          {!!listNft?.length &&
            listNft.map((sneaker, index) => (
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
                    sneaker={sneaker}
                    handleClickOpen={() => handleClickOpen(sneaker)}
                    getSneakersList={getSneakersList}
                  />
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>
      <SneakerModal
        sneaker={sneaker}
        open={open}
        handleClose={handleClose}
        getSneakersList={getSneakersList}
      />
    </React.Fragment>
  );
}
