'use strict';

var MongoClient = require('mongodb');
var request = require('request-promise-native');
var db = require('../db.js');
const CONNECTION_STRING = process.env.DB;

module.exports = function() {

  this.getStocks = function(tickers, like = false, ip = "") {
    if (!Array.isArray(tickers))
      tickers = [tickers];
    var result = {};
    return Promise.all([
      request({json: true, uri: "https://api.iextrading.com/1.0/stock/market/batch?symbols=" + tickers.join(",") + "&types=price"}),
      MongoClient.connect(CONNECTION_STRING)
    ]).then(([body, db]) => {
      var stocks = Object.keys(body);
      result.stockData = stocks.map(s => ({stock: s, price: body[s].price, likes: 0}));
      return Promise.all(stocks.map(s => db.collection('stocks').findOneAndUpdate(
        {stock: s},
        like ? {$addToSet: {likes: ip}} : {$set: {stock: s}}, // no-op because otherwise the returned document won't have all the info
        {returnOriginal: false, upsert: true}
      )))
    }).then(dbStocks => {
      dbStocks.forEach(s => {
        if (s.value) {
          result.stockData.find(rs => rs.stock == s.value.stock).likes = s.value.likes ? s.value.likes.length : 0;
        }
      });
      var stocks = Object.keys(result.stockData);
      if (stocks.length > 1) {
        stocks.forEach((s) => {
          result.stockData[s].rel_likes = result.stockData[s].likes - result.stockData[stocks[1-s]].likes;
        });
        stocks.forEach(s => {
          delete result.stockData[s].likes;
        });
      } else {
        result.stockData = result.stockData[0];
      }
      return result;
    });
  };

}