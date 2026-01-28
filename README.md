# Crypto Signals Pro 🚀

Plataforma profesional de señales de trading en tiempo real.

## Características
- ✅ Señales de trading en tiempo real
- ✅ Dashboard con estadísticas
- ✅ Sistema de usuarios y suscripciones
- ✅ Precios en vivo de criptomonedas
- ✅ Totalmente responsive

## Despliegue en Netlify

1. **Fork este repositorio** en tu GitHub
2. **Ve a [Netlify](https://app.netlify.com)**
3. Haz clic en "New site from Git"
4. Selecciona tu repositorio
5. Configura:
   - Build command: `npm run build`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

6. **Configura variables de entorno** en Netlify:
   - `JWT_SECRET`: Tu clave secreta para JWT
   - `FAUNA_SECRET`: Tu clave de FaunaDB (opcional)

7. ¡Listo! Tu sitio estará en `https://tusitio.netlify.app`

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev