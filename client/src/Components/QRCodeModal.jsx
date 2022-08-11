import React, { useContext, useState } from "react";

import { QRCodeCanvas } from "qrcode.react";
import { QRCodeContext } from "../Context/QRCode";
import { Dialog } from "@mui/material";


const QRCodeModal = () => {
  const { modalQRCode, setModalQRCode } = useContext(QRCodeContext);
  const [currentItem, setCurrentItem] = useState(0);
  console.log("modalQRCode", modalQRCode);


  return (
    <React.Fragment>
        <Dialog open={!!modalQRCode.length} onClose={()=>{
            setModalQRCode('');
        }}>
            <QRCodeCanvas size="300" value={modalQRCode} />
        </Dialog>
    </React.Fragment>
    
    // <Modal
    //   className="QRCode"
    //   title="QRCode"
    //   visible={modalQRCode.length > 0}
    //   onCancel={() =>
    //     setModalQRCode((pre) => (pre.length > 1 ? [pre.shift()] : []))
    //   }
    //   footer={false}
    //   width={348}
    // >
    //   <QRCodeCanvas size="300" value={modalQRCode[currentItem]} />
    //   <button key="pre" onClick={() => setCurrentItem((pre) => pre - 1)}>
    //     Pre
    //   </button>
    //   <button key="next" onClick={() => setCurrentItem((pre) => pre + 1)}>
    //     Next
    //   </button>
    // </Modal>
  );
};

export default QRCodeModal;
