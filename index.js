const axios = require("axios");
const crypto = require("crypto");
const { URLSearchParams } = require("url");

const SYMBOL = "BTCUSDT";
const BUY_PRICE = 62500;
const SELL_PRICE = 63300;
const QUANTITY = "0.001"
const API_KEY ="QOKDjYwhkwS2PwGEAeKVpV2L77pZ3RFB8jD2iXifa1gqgAhh769iuafbjiz30qR3";
const SECRET_KEY ="TB85tFvn5G6FtMVZ39FczZ0NnjTZ4mPNRelhRCRsnnzviY0bhRy2OoXmMWdSH51i";

const API_URL = "https://testnet.binance.vision";//https://api.binance.com

let isOpened = false;

function calcSMA(data){
    const closes= data.map(candle => parseFloat(candle[4]));
    const sum = closes.reduce((a,b) => a + b);
    return sum / data.length;
}

async function start(){
     const {data} = await axios.get(API_URL + "/api/v3/klines?limit=21&interval=15m&symbol="+SYMBOL);
     const candle = data[data.length - 1];
     const price = parseFloat(candle[4]);
     
     // Estrategia com 2 medias
     const sma21 = calcSMA(data);
     const sma13 = calcSMA(data.slice(8));
     console.clear();
     console.log('****** Estrategia de media com 21 velas e 13 velas ****** ');
     console.log("Preço: "+price);
     console.log("SMA(21): " + sma21);
     console.log("SMA(13): " + sma13);
     console.log("Is Opened? " + isOpened);

     if(sma13 > sma21 && isOpened === false ){
        isOpened = true;
        newOrder(SYMBOL, QUANTITY,"buy");
    }
    else if(sma13 < sma21 && isOpened === true ){
        isOpened = false;
        newOrder(SYMBOL, QUANTITY,"sell");
    }
    else
        console.log("aguardar")
}

async function newOrder(symbol,quantity,side){
    const order = {symbol,quantity,side};
    order.type = "MARKET";
    order.timestamp = Date.now();

    const signature = crypto
        .createHmac("sha256",SECRET_KEY)
        .update(new URLSearchParams(order).toString())
        .digest("hex");
    
    order.signature = signature;
    try{
        const {data} = await axios.post(
            API_URL + "/api/v3/order",
            new URLSearchParams(order).toString(),
            {headers:{"x-MBX-APIKEY": API_KEY}}
        )
        console.log(data);
    }
    catch(err){
        console.error(err.response.data)
    }
}

setInterval(start,4000);
start();