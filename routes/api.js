/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

var StockHandler = require('../controllers/stockHandler.js');
var stockPrices = new StockHandler();

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      stockPrices.getStocks(req.query.stock, req.query.like, req.ip)
        .then(stocks => { res.json(stocks); })
        .catch(console.log);
    });
    
};
