// netlify/functions/signals.js
const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Obtener señales
      const limit = event.queryStringParameters.limit || 20;
      
      // Datos de ejemplo (en producción esto vendría de una base de datos)
      const sampleSignals = [
        {
          id: 1,
          symbol: 'BTCUSDT',
          type: 'BUY',
          price: 45231.50,
          target: 46800.00,
          stop_loss: 44500.00,
          confidence: 85,
          timestamp: new Date().toISOString(),
          reason: 'Breakout de resistencia en 4h'
        },
        {
          id: 2,
          symbol: 'ETHUSDT',
          type: 'SELL',
          price: 2532.75,
          target: 2450.00,
          stop_loss: 2600.00,
          confidence: 72,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          reason: 'Sobrecompra en timeframe diario'
        },
        {
          id: 3,
          symbol: 'SOLUSDT',
          type: 'BUY',
          price: 102.30,
          target: 110.00,
          stop_loss: 98.00,
          confidence: 78,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          reason: 'Fuerte soporte en $100'
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          signals: sampleSignals.slice(0, limit)
        })
      };

    } else if (event.httpMethod === 'POST') {
      // Verificar autenticación
      const token = event.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'No autorizado'
          })
        };
      }

      const data = JSON.parse(event.body);
      
      if (data.action === 'subscribe') {
        // Aquí procesarías la suscripción a una señal
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Suscripción exitosa a la señal'
          })
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Acción no válida'
        })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      })
    };
  }
};