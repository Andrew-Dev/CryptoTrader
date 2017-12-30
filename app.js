const bittrex = require('node-bittrex-api')
const secrets = require('./secrets')

bittrex.websockets.client(() => {
    console.log("Socket connected")

    bittrex.websockets.subscribe(['BTC-XRP'], (data) => {
        console.log(data)
    })
})