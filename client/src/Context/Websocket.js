import React, { createContext } from 'react'

export const WebsocketContext = createContext()

const client = new WebSocket("ws://localhost:8000/ws")

export const WebsocketProvider = ({ children }) => {

    client.onopen = () => {
        console.log("Websocket connected")
    }

    client.onmessage = message=>{
        console.log("MESSAGE", message)
        const dataFromServer = JSON.parse(message.data);

        console.log("DATA FROM SERVER", dataFromServer)
        switch(dataFromServer.type){
            case "sneakerList":
                console.log("SNEAKER LIST", dataFromServer.data)
        }
    }

    const onSendMessage = (func, data) => {
        console.log("call", func, data);
        client.send(
            JSON.stringify({
                type: func,
                message: String(data),
            })
        );
    };

    

    return (
        <WebsocketContext.Provider value={{client, onSendMessage}}>
            {children}
        </WebsocketContext.Provider>
    )
}
