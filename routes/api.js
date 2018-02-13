var express = require('express');
var axios = require('axios');
var coinMarketCapDataMapper = require('../mapper/coin-market-cap.mapper');
var koinexMapper = require('../mapper/koinex.mapper');
var coinomeMapper = require('../mapper/coinome.mapper');
var zebapiMapper = require('../mapper/zepapi.mapper');
var router = express.Router();


router.get('/', function (req, res, next) {
    axios.get('https://koinex.in/api/ticker').then(
        function(response) {
            console.dir(response.data);
            res.send(response.data);
        }
    ).catch(function (error) {
        // handle error
        console.log(error);
        res.send("Error happened: "+error);
    })

});
router.get('/coinmarketdata', function (req, res) {
    axios.get('https://api.coinmarketcap.com/v1/ticker/?convert=INR').then(
        function (response) {
            res.send(response.data);
        }
    )
});

var cache = {
    timestamp: 0
};

const interval = 300000;

router.get('/comparison', function (req, res) {
    var timestamp = new Date().getTime();
    if(timestamp - cache.timestamp > interval) {
        console.log('fetching new data');
        axios.all([
            // axios.get('https://api.coinmarketcap.com/v1/ticker/?convert=INR'),
            axios.get('https://koinex.in/api/ticker'),
            axios.get('https://www.coinome.com/api/v1/ticker.json'),
            axios.get('https://www.zebapi.com/api/v1/market/ticker-new/btc/inr'),
            axios.get('https://www.zebapi.com/api/v1/market/ticker-new/bch/inr'),
            axios.get('https://www.zebapi.com/api/v1/market/ticker-new/ltc/inr'),
            axios.get('https://www.zebapi.com/api/v1/market/ticker-new/xrp/inr'),
        ])
            .then(
                axios.spread(function (/*coinMarketRes,*/ koinexRes, coinomeRes,
                                       zebapiBtc, zebapiBch, zebapiLtc, zebapiXrp) {
                        // console.log(response.data);
                        var coinObject = {};
                        // var coins = coinMarketRes.data;
                        // coinObject = coinMarketCapDataMapper(coins, coinObject);
                        coinObject = koinexMapper(koinexRes.data, coinObject);
                        coinObject = coinomeMapper(coinomeRes.data, coinObject);


                        coinObject = zebapiMapper(zebapiBtc.data, coinObject, 'BTC');
                        coinObject = zebapiMapper(zebapiBch.data, coinObject, 'BCH');
                        coinObject = zebapiMapper(zebapiLtc.data, coinObject, 'LTC');
                        coinObject = zebapiMapper(zebapiXrp.data, coinObject, 'XRP');
                        let marketOrientedData = coinObject;
                        let coinOrientedData = require('../mapper/market-oriented-to-coin-oriented.mapper')(marketOrientedData);
                        cache = {
                            timestamp: new Date().getTime(),
                            data: coinOrientedData
                        };
                        res.send(coinOrientedData);
                    }
                )).catch(function (error) {
                    console.log('Error occured');
                            console.log(error.stack);
                            res.send(error.response.data);
                });
    } else {
        console.log('serving from cache');
        res.send(cache.data);
    }
    // res.send('coin connected');

})

module.exports = router;


