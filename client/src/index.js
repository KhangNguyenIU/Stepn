import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { MoveProvider } from './Context/MoveContext';
import { QRCodeProvider } from './Context/QRCode';
import { WebsocketProvider } from './Context/Websocket';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <MoveProvider>
            <QRCodeProvider>
                <WebsocketProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </WebsocketProvider>
            </QRCodeProvider>
        </MoveProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
