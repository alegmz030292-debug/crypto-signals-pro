// netlify/functions/auth.js
const faunadb = require('faunadb');
const q = faunadb.query;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FAUNA_SECRET = process.env.FAUNA_SECRET;

// Inicializar FaunaDB
const client = new faunadb.Client({
  secret: FAUNA_SECRET || 'your-fauna-secret'
});

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Manejar preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { action, email, password, username } = data;

    if (action === 'register') {
      // Registrar nuevo usuario
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await client.query(
        q.Create(
          q.Collection('users'),
          {
            data: {
              username,
              email,
              password: hashedPassword,
              tier: 'free',
              credits: 10,
              created_at: q.Now(),
              last_login: q.Now()
            }
          }
        )
      );

      const token = jwt.sign(
        { userId: user.ref.id, email: user.data.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token,
          user: {
            id: user.ref.id,
            username: user.data.username,
            email: user.data.email,
            tier: user.data.tier,
            credits: user.data.credits
          }
        })
      };

    } else if (action === 'login') {
      // Iniciar sesión
      const user = await client.query(
        q.Get(
          q.Match(q.Index('users_by_email'), email)
        )
      );

      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Usuario no encontrado'
          })
        };
      }

      const validPassword = await bcrypt.compare(password, user.data.password);
      if (!validPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Contraseña incorrecta'
          })
        };
      }

      // Actualizar último login
      await client.query(
        q.Update(
          user.ref,
          {
            data: { last_login: q.Now() }
          }
        )
      );

      const token = jwt.sign(
        { userId: user.ref.id, email: user.data.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token,
          user: {
            id: user.ref.id,
            username: user.data.username,
            email: user.data.email,
            tier: user.data.tier,
            credits: user.data.credits
          }
        })
      };

    } else {
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

    // Error específico para email duplicado
    if (error.description && error.description.includes('unique constraint violated')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'El email ya está registrado'
        })
      };
    }

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