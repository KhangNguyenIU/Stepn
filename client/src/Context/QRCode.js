
import { createContext, useState } from 'react';
import addressess from '../address/contractAddress.json'
import { sneaker } from '../Constants'
import BigNumber from "bignumber.js";

export const QRCodeContext = createContext()

export const QRCodeProvider = ({ children }) => {
    const [modalQRCode, setModalQRCode] = useState('');

    const getQRCode = (func, data) => {
        switch (func) {
            case "levelingSneaker":
                setModalQRCode((pre) => [
                    getSendInput(addressess.sneakerNFT, data, sneaker.levelUp),
                ]);
                break;
            default:
                return null;
        }
    };

    const getSendInput = (address, data, func, amount = null) => {
        console.log(address, " - ", data, " - ", func, " - ", amount);
        let input = func;
        data.forEach((item) => {
        	input += formatHexData(item);
        	console.log(input);
        });
        const qrcode =
        	"call|" + address.slice(2) + "|" + (amount ? amount : "") + "|" + input;
        // console.log(qrcode);
        return qrcode;
    };

    const formatHexData = (data) => {
        switch (data.type) {
            case "number":
                return formatHexNumber(data.value);
            case "address":
                return formatHexAddress(data.value);
            default:
                return null;
        }
    };

    const formatHexAddress = (data) => {
        const hex = data.slice(2);
        return "0".repeat(64 - hex.length) + hex;
    };

    const formatHexNumber = (data) => {
        const hex = BigNumber(data).toString(16);
        return "0".repeat(64 - hex.length) + hex;
    };

    return (
        <QRCodeContext.Provider
            value={{ getQRCode, modalQRCode, setModalQRCode, formatHexData }}
        >
            {children}
        </QRCodeContext.Provider>
    );
};
