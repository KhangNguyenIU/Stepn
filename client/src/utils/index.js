
export const timeLeft = time =>{
    return Math.floor(time - Date.now()/1000) > 0 ? Math.floor(time - Date.now()/1000) : 0;
}