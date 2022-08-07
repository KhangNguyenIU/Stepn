import { Alert, Snackbar } from '@mui/material';
import React, { useContext } from 'react';
import { MoveContext } from '../Context/MoveContext';

export default function Notification() {
  const { notify, setNotification } = useContext(MoveContext);

  return (
    <React.Fragment>
      {!!notify.message.length && (
        <Snackbar
          open={!!notify?.message?.length}
          onClose={() => setNotification('', notify?.type)}
          autoHideDuration={2000}
        >
          <Alert
            severity={notify?.type}
            onClose={() => setNotification('', notify?.type)}
          >
            {notify?.message}
          </Alert>
        </Snackbar>
      )}
    </React.Fragment>
  );
}
