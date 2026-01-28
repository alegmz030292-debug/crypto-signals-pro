// netlify/functions/prices.js
const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Obtener precios reales de Binance
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
    const allTickers = response.data;
    
    // Filtrar solo USDT pairs y limitar a 10
    const usdtTickers = allTickers
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .slice(0, 10)
      .map(ticker => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        change: parseFloat(ticker.priceChangePercent),
        volume: parseFloat(ticker.volume) * parseFloat(ticker.lastPrice),
        high: parseFloat(ticker.highPrice),
        low: parseFloat(ticker.lowPrice)
      }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        prices: usdtTickers,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error obteniendo precios:', error);
    
    // Datos de ejemplo si falla la API
    const samplePrices = [
      { symbol: 'BTCUSDT', price: 45231.50, change: 2.5, volume: 28500000 },
      { symbol: 'ETHUSDT', price: 2532.75, change: 1.8, volume: 12500000 },
      { symbol: 'BNBUSDT', price: 322.40, change: 3.2, volume: 5200000 },
      { symbol: 'SOLUSDT', price: 102.30, change: 5.5, volume: 3200000 },
      { symbol: 'XRPUSDT', price: 0.63, change: -0.3, volume: 1900000 }
    ];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        prices: samplePrices,
        timestamp: new Date().toISOString(),
        note: 'Datos de demostración'
      })
    };
  }
};