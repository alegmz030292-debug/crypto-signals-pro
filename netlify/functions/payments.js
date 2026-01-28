// netlify/functions/payments.js
const axios = require('axios');
const crypto = require('crypto');

// TU WALLET TRC20
const YOUR_WALLET = 'TKn8tCZKN2aSv48MGkwaLAVPodDZMtPeRV';

// Precios en USDT
const PRICES = {
  'free': 0,
  'pro': 49,
  'vip': 99
};

// Base de datos en memoria (en producción usa FaunaDB o similar)
let usersDB = {};
let paymentsDB = {};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { action, userId, plan, paymentId, txHash } = data;

    if (action === 'generate_payment') {
      // Generar nueva dirección de pago única
      const paymentId = crypto.randomBytes(8).toString('hex');
      const amount = PRICES[plan];
      
      // Guardar en base de datos temporal
      paymentsDB[paymentId] = {
        userId,
        plan,
        amount,
        status: 'pending',
        created: Date.now(),
        wallet: YOUR_WALLET
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          paymentId,
          wallet: YOUR_WALLET,
          amount,
          plan,
          instructions: `Envía exactamente ${amount} USDT (TRC20) a la dirección arriba`
        })
      };
      
    } else if (action === 'check_payment') {
      // Verificar si llegó el pago
      const payment = paymentsDB[paymentId];
      
      if (!payment) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Pago no encontrado'
          })
        };
      }
      
      // Verificar transacción en TronScan
      const verified = await verifyTronTransaction(txHash, payment);
      
      if (verified) {
        // Actualizar estado del pago
        payment.status = 'completed';
        payment.confirmedAt = Date.now();
        
        // Actualizar usuario a VIP
        if (usersDB[payment.userId]) {
          usersDB[payment.userId].plan = payment.plan;
          usersDB[payment.userId].expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            verified: true,
            plan: payment.plan
          })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          verified: false,
          message: 'Pago aún no recibido'
        })
      };
      
    } else if (action === 'get_user_plan') {
      // Obtener plan del usuario
      const user = usersDB[userId];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          plan: user?.plan || 'free',
          expiresAt: user?.expiresAt || null
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
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error interno'
      })
    };
  }
};

// Verificar transacción en TronScan
async function verifyTronTransaction(txHash, payment) {
  try {
    // Usar TronScan API
    const response = await axios.get(`https://apilist.tronscan.org/api/transaction-info?hash=${txHash}`);
    const tx = response.data;
    
    // Verificar que:
    // 1. La transacción existe
    // 2. Fue a TU wallet
    // 3. El monto es correcto
    // 4. Está confirmada
    
    if (tx.contractData && tx.contractData.amount) {
      const amount = tx.contractData.amount / 1000000; // Convertir de SUN a USDT
      const toAddress = tx.contractData.to_address;
      
      return (
        toAddress === YOUR_WALLET.toLowerCase() &&
        Math.abs(amount - payment.amount) < 1 && // +/- 1 USDT de tolerancia
        tx.confirmed === true
      );
    }
    
    return false;
    
  } catch (error) {
    console.error('Error verificando transacción:', error);
    return false;
  }
}