const bittrex = require('node-bittrex-api')
const secrets = require('./secrets')

bittrex.options({
    'apikey' : secrets.key,
    'apisecret' : secrets.secret,
})

let totalBuys = 0
let totalSells = 0
let buySellRatio = 0

bittrex.websockets.client(() => {
    console.log(new Date().toString())
    console.log("Socket connected")

    bittrex.websockets.subscribe(['BTC-XRP'], (data) => {
        if(data.M === 'updateExchangeState') {
            //console.log(data.A[0].Buys.length + " new buys",data.A[0].Sells.length + " new sells")
            totalBuys += data.A[0].Buys.length
            totalSells += data.A[0].Sells.length
            buySellRatio = totalBuys / totalSells
            console.log(totalBuys + " Total buys " + totalSells + " Total sells " + buySellRatio + " Buy sell ratio ")
        }
    })
})