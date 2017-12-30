const bittrex = require('node-bittrex-api')
const secrets = require('./secrets')

bittrex.options({
    'apikey' : secrets.key,
    'apisecret' : secrets.secret,
})

const interval = 10000
const fromCurrency = "BTC"
const toCurrency = "XRP"

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
let boughtOnInterval = false
let soldOnInterval = false

console.log("Awaiting connection to Bittrex...")
bittrex.websockets.client(() => {
    console.log("Socket connected at " + new Date().toString())

    bittrex.websockets.subscribe([fromCurrency + '-' + toCurrency], (data) => {
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
            buyDecision()
        }
    })

    setTimeout(() => {
        lastIntervalBuyRate = averageBuyRate
        resetValues()
        console.log("\nGot first average " + lastIntervalBuyRate)
        setInterval(() => {
            intervalCount++
            const priceChange = averageBuyRate - lastIntervalBuyRate
            intervalBuyChange = 100 * (priceChange / lastIntervalBuyRate)
            lastIntervalBuyRate = averageBuyRate
            console.log("\n\nInterval " + intervalCount + " at " + new Date().toString())
            console.log(totalBuys + " Total buys " + totalSells + " Total sells " + buySellRatio + " Buy sell ratio ")
            console.log(averageBuyRate + " Avg. Buy (BTC) " + averageSellRate + " Avg. Sell (BTC)")
            console.log("Change from last interval: " + priceChange + " BTC | " + intervalBuyChange + "%")
            console.log("Wallet Balances - BTC: " + BTC + " XRP: " + XRP)
            const totalOriginalValue = BTC + lastIntervalBuyRate * XRP
            console.log("Total " + fromCurrency + " value: " + totalOriginalValue)
            resetValues()
        },interval)
    },interval)
})

const buyDecision = () => {
    if(interval > 0 && boughtOnInterval === false && BTC > 0.1 && intervalBuyChange < 0 && buySellRatio > 2.5) {
        BTC -= 0.01
        const otherAmount = 0.9975 * (0.01 / lastIntervalBuyRate)
        XRP += otherAmount
        boughtOnInterval = true

        console.log("\nPURCHASE MADE")
        console.log("Bought " + otherAmount + " " + toCurrency + " at " + averageBuyRate + " " + fromCurrency + "/" + toCurrency)
        console.log("Wallet Balances - BTC: " + BTC + " XRP: " + XRP)
    }
}

const resetValues = () => {
    averageBuyRate = 0
    averageSellRate = 0
    totalBuys = 0
    totalSells = 0
    boughtOnInterval = false
}

const addRateToAverage = (oldAverage,oldSize,arr) => {
    let average = oldAverage
    let size = oldSize
    arr.map((item) => {
        average = average + ((item.Rate - average) / ++size)
    })
    return average
}

process.on('SIGINT',() => {
    console.log("\nBTC: " + BTC + " XRP: " + XRP)
    process.exit()
})