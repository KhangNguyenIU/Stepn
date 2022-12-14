import { useContext, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom'

import './App.css';
import Home from './Components/Home';
import Inventory from './Components/Inventory';
import Loading from './Components/Loading';
import Marketplace from './Components/Marketplace/index';
import Notification from './Components/Notification';
import QRCodeModal from './Components/QRCodeModal';
import { MoveContext } from './Context/MoveContext';
import { QRCodeContext } from './Context/QRCode';
import { WebsocketContext } from './Context/Websocket';


function App() {
    const { setCurrentAccount, setNotification, currentAccount } = useContext(MoveContext)
    const { getQRCode } = useContext(QRCodeContext)
    const { client, onSendMessage} = useContext(WebsocketContext)

    useEffect(() => {
        window.ethereum.on('accountsChanged', function (account) {
            setCurrentAccount(account)
        })
    }, [])
    
    useEffect(()=>{
        if(currentAccount){
            // console.log("current account", currentAccount)
            onSendMessage('sneakerNFT', "113521d4775b498450dad5738a0e6cbd83f67247")
        }
    },[currentAccount])

    return (
        <div className="App">
            <Routes>
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/" element={<Inventory />} />
            </Routes>

            <Notification />
            <Loading />
            <QRCodeModal />
        </div>
    );
}

export default App;
