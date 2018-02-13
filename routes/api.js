var express = require('express');
var axios = require('axios');
var coinMarketCapDataMapper = require('../mapper/coin-market-cap.mapper');
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


router.get('/coin', function (req, res) {
    axios.all([
        axios.get('https://api.coinmarketcap.com/v1/ticker/?convert=INR'),
        axios.get('https://koinex.in/api/ticker')
        ])
        .then(
        axios.spread(function (coinMarketRes, koinexRes) {
            // console.log(response.data);
            var coinObject = {};
            var coins = coinMarketRes.data;
            coinObject = coinMarketCapDataMapper(coins, coinObject);

            res.send(coinObject);
        }
    )).catch(function (error) {
        console.log(error);
    });
    // res.send('coin connected');

})

module.exports = router;


