// netlify/functions/admin.js
const crypto = require('crypto');

// Clave secreta para admin
const ADMIN_SECRET = 10597788Ale@ || 'cambia-esto-en-produccion';

// Datos de ejemplo
const payments = [
  {
    id: 'abc123',
    userId: 'user1',
    username: 'trader_juan',
    email: 'juan@email.com',
    plan: 'vip',
    amount: 99,
    status: 'completed',
    date: '2024-01-15 14:30:00',
    txHash: '0x123...abc'
  },
  {
    id: 'def456',
    userId: 'user2',
    username: 'crypto_maria',
    email: 'maria@email.com',
    plan: 'pro',
    amount: 49,
    status: 'completed',
    date: '2024-01-14 10:15:00',
    txHash: '0x456...def'
  },
  {
    id: 'ghi789',
    userId: 'user3',
    username: 'investor_pedro',
    email: 'pedro@email.com',
    plan: 'vip',
    amount: 99,
    status: 'pending',
    date: '2024-01-15 16:45:00',
    txHash: null
  }
];

const users = [
  {
    id: 'user1',
    username: 'trader_juan',
    email: 'juan@email.com',
    plan: 'vip',
    joined: '2024-01-01',
    expires: '2024-02-15',
    totalPaid: 99
  },
  {
    id: 'user2',
    username: 'crypto_maria',
    email: 'maria@email.com',
    plan: 'pro',
    joined: '2024-01-10',
    expires: '2024-02-14',
    totalPaid: 49
  },
  {
    id: 'user3',
    username: 'investor_pedro',
    email: 'pedro@email.com',
    plan: 'free',
    joined: '2024-01-15',
    expires: null,
    totalPaid: 0
  }
];

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
    // Verificar clave admin
    const authHeader = event.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No autorizado'
        })
      };
    }

    const data = JSON.parse(event.body || '{}');
    const { action } = data;

    if (action === 'get_stats') {
      // Estadísticas generales
      const stats = {
        totalUsers: users.length,
        vipUsers: users.filter(u => u.plan === 'vip').length,
        proUsers: users.filter(u => u.plan === 'pro').length,
        freeUsers: users.filter(u => u.plan === 'free').length,
        totalRevenue: payments.filter(p => p.status === 'completed')
                           .reduce((sum, p) => sum + p.amount, 0),
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        monthlyRevenue: payments.filter(p => {
          const paymentDate = new Date(p.date);
          const now = new Date();
          return p.status === 'completed' && 
                 paymentDate.getMonth() === now.getMonth() &&
                 paymentDate.getFullYear() === now.getFullYear();
        }).reduce((sum, p) => sum + p.amount, 0)
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          stats,
          recentPayments: payments.slice(0, 10),
          recentUsers: users.slice(0, 10)
        })
      };

    } else if (action === 'get_payments') {
      // Todos los pagos
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          payments: payments.sort((a, b) => new Date(b.date) - new Date(a.date))
        })
      };

    } else if (action === 'get_users') {
      // Todos los usuarios
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          users: users.sort((a, b) => new Date(b.joined) - new Date(a.joined))
        })
      };

    } else if (action === 'update_user') {
      // Actualizar usuario manualmente
      const { userId, plan, expiresAt } = data;
      
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].plan = plan;
        if (expiresAt) users[userIndex].expires = expiresAt;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Usuario actualizado'
        })
      };

    } else if (action === 'verify_payment') {
      // Verificar pago manualmente
      const { paymentId, txHash } = data;
      
      const paymentIndex = payments.findIndex(p => p.id === paymentId);
      if (paymentIndex !== -1) {
        payments[paymentIndex].status = 'completed';
        payments[paymentIndex].txHash = txHash;
        
        // Actualizar usuario
        const payment = payments[paymentIndex];
        const userIndex = users.findIndex(u => u.id === payment.userId);
        if (userIndex !== -1) {
          users[userIndex].plan = payment.plan;
          users[userIndex].expires = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
            .toISOString().split('T')[0];
          users[userIndex].totalPaid += payment.amount;
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Pago verificado'
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
    console.error('Error admin:', error);
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