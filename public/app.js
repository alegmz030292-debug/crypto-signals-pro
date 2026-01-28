/**
 * Crypto Signals Pro - Frontend JavaScript
 */

// Variables globales
let currentUser = null;
const API_BASE = '/.netlify/functions';

// Sistema de Autenticación
class AuthSystem {
    static async login(email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'login', email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('crypto_token', data.token);
                localStorage.setItem('crypto_user', JSON.stringify(data.user));
                currentUser = data.user;
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    static async register(username, email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    action: 'register', 
                    username, 
                    email, 
                    password 
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    static logout() {
        localStorage.removeItem('crypto_token');
        localStorage.removeItem('crypto_user');
        currentUser = null;
        window.location.href = 'index.html';
    }
    
    static checkAuth() {
        const token = localStorage.getItem('crypto_token');
        const user = localStorage.getItem('crypto_user');
        
        if (token && user) {
            currentUser = JSON.parse(user);
            return true;
        }
        return false;
    }
    
    static getCurrentUser() {
        return currentUser;
    }
}

// Sistema de Señales
class SignalSystem {
    static async getSignals(limit = 20) {
        try {
            const response = await fetch(`${API_BASE}/signals?limit=${limit}`);
            return await response.json();
        } catch (error) {
            return { success: false, signals: [] };
        }
    }
    
    static async getLivePrices() {
        try {
            const response = await fetch(`${API_BASE}/prices`);
            return await response.json();
        } catch (error) {
            return { success: false, prices: [] };
        }
    }
    
    static async subscribeToSignal(signalId) {
        if (!AuthSystem.checkAuth()) {
            return { success: false, error: 'Debes iniciar sesión' };
        }
        
        try {
            const response = await fetch(`${API_BASE}/signals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crypto_token')}`
                },
                body: JSON.stringify({ action: 'subscribe', signalId })
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
}

// Sistema de Usuarios
class UserSystem {
    static async updateProfile(userData) {
        if (!AuthSystem.checkAuth()) {
            return { success: false, error: 'Debes iniciar sesión' };
        }
        
        try {
            const response = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crypto_token')}`
                },
                body: JSON.stringify({ action: 'update', ...userData })
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    static async upgradePlan(plan) {
        if (!AuthSystem.checkAuth()) {
            return { success: false, error: 'Debes iniciar sesión' };
        }
        
        try {
            const response = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crypto_token')}`
                },
                body: JSON.stringify({ action: 'upgrade', plan })
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }
}

// UI Helpers
class UI {
    static showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    static formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(price);
    }
    
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    static updateDashboardStats() {
        const user = AuthSystem.getCurrentUser();
        if (!user) return;
        
        // Actualizar elementos del DOM
        document.querySelectorAll('.user-credits').forEach(el => {
            el.textContent = user.credits || 0;
        });
        
        document.querySelectorAll('.user-tier').forEach(el => {
            el.textContent = user.tier || 'free';
            el.className = `user-tier tier-${user.tier || 'free'}`;
        });
        
        document.querySelectorAll('.username-display').forEach(el => {
            el.textContent = user.username || 'Usuario';
        });
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (AuthSystem.checkAuth()) {
        UI.updateDashboardStats();
        
        // Si está en login/register, redirigir al dashboard
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
        
        // Cargar señales si estamos en dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            loadDashboardData();
        }
    } else {
        // Si no está autenticado y está en dashboard, redirigir a login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
    
    // Manejar formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = await AuthSystem.login(email, password);
            
            if (result.success) {
                UI.showAlert('¡Inicio de sesión exitoso!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                UI.showAlert(result.error, 'error');
            }
        });
    }
    
    // Manejar formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                UI.showAlert('Las contraseñas no coinciden', 'error');
                return;
            }
            
            const result = await AuthSystem.register(username, email, password);
            
            if (result.success) {
                UI.showAlert('¡Registro exitoso! Inicia sesión para continuar.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                UI.showAlert(result.error, 'error');
            }
        });
    }
    
    // Botón de logout
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            AuthSystem.logout();
        });
    });
});

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Cargar señales
        const signalsData = await SignalSystem.getSignals(10);
        if (signalsData.success && signalsData.signals) {
            renderSignalsTable(signalsData.signals);
        }
        
        // Cargar precios
        const pricesData = await SignalSystem.getLivePrices();
        if (pricesData.success && pricesData.prices) {
            renderLivePrices(pricesData.prices);
        }
        
        // Actualizar cada 30 segundos
        setTimeout(loadDashboardData, 30000);
        
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Renderizar tabla de señales
function renderSignalsTable(signals) {
    const container = document.getElementById('signalsContainer');
    if (!container) return;
    
    let html = `
    <div class="table-header">
        <div>Hora</div>
        <div>Activo</div>
        <div>Tipo</div>
        <div>Precio</div>
        <div>Target</div>
        <div>Confianza</div>
    </div>`;
    
    signals.forEach(signal => {
        const signalClass = signal.type === 'BUY' ? 'signal-buy' : 'signal-sell';
        
        html += `
        <div class="table-row">
            <div>${UI.formatDate(signal.timestamp)}</div>
            <div><strong>${signal.symbol}</strong></div>
            <div class="${signalClass}"><strong>${signal.type}</strong></div>
            <div>${UI.formatPrice(signal.price)}</div>
            <div>${UI.formatPrice(signal.target)}</div>
            <div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${signal.confidence}%"></div>
                </div>
                <small>${signal.confidence}%</small>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// Renderizar precios en vivo
function renderLivePrices(prices) {
    const container = document.getElementById('pricesContainer');
    if (!container) return;
    
    let html = '';
    
    prices.forEach(price => {
        const changeClass = price.change >= 0 ? 'positive' : 'negative';
        
        html += `
        <div class="price-card">
            <div class="symbol">${price.symbol}</div>
            <div class="price">${UI.formatPrice(price.price)}</div>
            <div class="change ${changeClass}">
                ${price.change >= 0 ? '+' : ''}${price.change.toFixed(2)}%
            </div>
            <div class="volume">Vol: $${(price.volume / 1000000).toFixed(1)}M</div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// Exportar para uso global
window.AuthSystem = AuthSystem;
window.SignalSystem = SignalSystem;
window.UserSystem = UserSystem;
window.UI = UI;