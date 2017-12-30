const bittrex = require('node-bittrex-api')
const secrets = require('./secrets')

bittrex.options({
    'apikey' : secrets.key,
    'apisecret' : secrets.secret,
})

const interval = 5000

let totalBuys = 0
let totalSells = 0
let buySellRatio = 0
let sellBuyRatio = 0
let averageBuyRate = 0
let averageSellRate = 0
let lastIntervalBuyRate = 0
let intervalBuyChange = 0

let BTC = 1
let XRP = 0

let intervalCount = 0

console.log("Awaiting connection to Bittrex...")
bittrex.websockets.client(() => {
    console.log("Socket connected at " + new Date().toString())

    bittrex.websockets.subscribe(['BTC-XRP'], (data) => {
        if(data.M === 'updateExchangeState') {
            //console.log(data.A[0].Buys)
            const buys = data.A[0].Buys
            const sells = data.A[0].Sells
            //console.log(data.A[0].Buys.length + " new buys",data.A[0].Sells.length + " new sells")
            totalBuys += data.A[0].Buys.length
            totalSells += data.A[0].Sells.length
            buySellRatio = totalBuys / totalSells
            sellBuyRatio = totalSells / totalBuys
            averageBuyRate = addRateToAverage(averageBuyRate,totalBuys,buys)
            averageSellRate = addRateToAverage(averageSellRate,totalSells,sells)
        }
    })

    setTimeout(() => {
        lastIntervalBuyRate = averageBuyRate
        resetValues()
        console.log("\nGot first average " + lastIntervalBuyRate)
        setInterval(() => {
            intervalCount++
            const priceChange = averageBuyRate - lastIntervalBuyRate
            intervalBuyChange = priceChange / lastIntervalBuyRate
            lastIntervalBuyRate = averageBuyRate
            console.log("\n\nInterval " + intervalCount + " at " + new Date().toString())
            console.log(totalBuys + " Total buys " + totalSells + " Total sells " + buySellRatio + " Buy sell ratio ")
            console.log(averageBuyRate + " Avg. Buy (BTC) " + averageSellRate + " Avg. Sell (BTC)")
            console.log("Change from last interval: " + priceChange + " BTC | " + intervalBuyChange + "%")
            resetValues()
        },interval)
    },interval)
})

const resetValues = () => {
    averageBuyRate = 0
    averageSellRate = 0
    totalBuys = 0
    totalSells = 0
}

const addRateToAverage = (oldAverage,oldSize,arr) => {
    let average = oldAverage
    let size = oldSize
    arr.map((item) => {
        average = average + ((item.Rate - average) / ++size)
    })
    return average
}
