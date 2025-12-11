
import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Package, Truck, BarChart3, Settings, LogOut, Search, Filter, Plus, Edit, Trash2, Eye, Menu, X, Home, Bell, DollarSign, Users, TrendingUp, Activity, Mail, MessageSquare, Phone } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TENANT_ID = 1;

// API Helper Functions
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  auth: {
    login: (email, password) =>
      api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, tenantId: TENANT_ID }),
      }),
    register: (userData) =>
      api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...userData, tenantId: TENANT_ID }),
      }),
    getMe: () => api.request('/auth/me'),
  },

  products: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/products?${query}`);
    },
    getById: (id) => api.request(`/products/${id}`),
    create: (product) => api.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

   update: (id, product) => api.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
    delete: (id) => api.request(`/products/${id}`, { method: 'DELETE' }),
    getCategories: () => api.request('/products/categories/list'),
  },

  orders: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/orders?${query}`);
    },
    getById: (id) => api.request(`/orders/${id}`),
    create: (orderData) => api.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
    updateStatus: (id, status) => api.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    getStats: () => api.request('/orders/stats/dashboard'),
  },

  notifications: {
    getLogs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/notifications/logs?${query}`);
    },
    getStats: () => api.request('/notifications/stats'),
    sendTest: (type, userId) => api.request('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ type, userId }),
    }),
  },
};

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Main App Component
export default function MultiTenantEcommerce() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await api.auth.register(userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout }}>
      <div className="min-h-screen bg-gray-50">
        {!currentUser ? (
          <LoginPage />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard />
        ) : currentUser.role === 'delivery' ? (
          <DeliveryDashboard />
        ) : (
          <CustomerStore />
        )}
      </div>
    </AuthContext.Provider>
  );
}

// Login Page Component
function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin 
      ? await login(formData.email, formData.password)
      : await register(formData);

    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const quickLogin = (role) => {
    const users = {
      admin: { email: 'admin@freshmart.com', password: 'admin123' },
      delivery: { email: 'delivery@freshmart.com', password: 'delivery123' },
      customer: { email: 'customer@example.com', password: 'customer123' }
    };
    setFormData(users[role]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FreshMart</h1>
          <p className="text-gray-600">Fresh & Quality Products</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              isLogin ? 'bg-white shadow' : 'text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              !isLogin ? 'bg-white shadow' : 'text-gray-600'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="2"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Demo Accounts:</p>
            <div className="space-y-2">
              <button onClick={() => quickLogin('admin')} className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-200">
                Admin Demo
              </button>
              <button onClick={() => quickLogin('delivery')} className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg text-sm hover:bg-purple-200">
                Delivery Demo
              </button>
              <button onClick={() => quickLogin('customer')} className="w-full bg-green-100 text-green-700 py-2 rounded-lg text-sm hover:bg-green-200">
                Customer Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { currentUser, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [notificationStats, setNotificationStats] = useState(null);

  useEffect(() => {
    loadStats();
    loadNotificationStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.orders.getStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadNotificationStats = async () => {
    try {
      const data = await api.notifications.getStats();
      setNotificationStats(data.stats);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
          <p className="text-sm text-gray-600 mt-1">{currentUser.name}</p>
        </div>
        <nav className="p-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeTab === tab.id ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-4"
          >
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'products' && 'Product Management'}
            {activeTab === 'orders' && 'Order Management'}
            {activeTab === 'notifications' && 'Notification Center'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'settings' && 'Settings'}
          </h1>
        </header>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardView stats={stats} notificationStats={notificationStats} />
          )}
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'notifications' && <NotificationManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </main>
    </div>
  );
}


// Dashboard View
function DashboardView({ stats, notificationStats }) {
  if (!stats) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} label="Total Orders" value={stats.total_orders} color="blue" />
        <StatCard icon={DollarSign} label="Revenue" value={`₹${stats.total_revenue || 0}`} color="green" />
        <StatCard icon={Truck} label="In Transit" value={stats.in_transit_orders} color="purple" />
        <StatCard icon={Bell} label="Pending" value={stats.pending_orders} color="orange" />
      </div>

      {notificationStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell size={20} />
            Notification Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Mail className="mx-auto text-blue-500 mb-2" size={24} />
              <p className="text-2xl font-bold">{notificationStats.order_confirmations || 0}</p>
              <p className="text-sm text-gray-600">Order Confirmations</p>
            </div>
            <div className="text-center">
              <MessageSquare className="mx-auto text-green-500 mb-2" size={24} />
              <p className="text-2xl font-bold">{notificationStats.status_updates || 0}</p>
              <p className="text-sm text-gray-600">Status Updates</p>
            </div>
            <div className="text-center">
              <Phone className="mx-auto text-purple-500 mb-2" size={24} />
              <p className="text-2xl font-bold">{notificationStats.welcome_sent || 0}</p>
              <p className="text-sm text-gray-600">Welcome Messages</p>
            </div>
            <div className="text-center">
              <Activity className="mx-auto text-orange-500 mb-2" size={24} />
              <p className="text-2xl font-bold">{notificationStats.total_notifications || 0}</p>
              <p className="text-sm text-gray-600">Total Sent</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Order Status</h3>
          <div className="space-y-3">
            <StatusBar label="Pending" value={stats.pending_orders} total={stats.total_orders} color="yellow" />
            <StatusBar label="Processing" value={stats.processing_orders} total={stats.total_orders} color="blue" />
            <StatusBar label="In Transit" value={stats.in_transit_orders} total={stats.total_orders} color="purple" />
            <StatusBar label="Delivered" value={stats.delivered_orders} total={stats.total_orders} color="green" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-100 text-blue-700 py-3 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2">
              <Plus size={20} />
              Add New Product
            </button>
            <button className="w-full bg-green-100 text-green-700 py-3 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2">
              <Eye size={20} />
              View All Orders
            </button>
            <button className="w-full bg-purple-100 text-purple-700 py-3 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-2">
              <Bell size={20} />
              Send Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function StatusBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colors = {
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500'
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${colors[color]} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// Product Management Component
function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.products.getAll();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    
    try {
      await api.products.delete(id);
      loadProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-12">Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow p-4">
            <div className="text-4xl mb-3 text-center">{product.image_url || '📦'}</div>
            <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{product.category_name}</p>
            <p className="text-sm text-gray-500 mb-3">{product.description}</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-green-600">₹{product.price}</span>
              <span className={`text-sm px-2 py-1 rounded ${product.stock > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Stock: {product.stock}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200">
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Order Management Component
function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.orders.getAll();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.orders.updateStatus(id, status);
      loadOrders();
      alert('Order status updated and notifications sent!');
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  if (loading) return <div className="text-center py-12">Loading orders...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">#{order.order_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{order.customer_name}</td>
              <td className="px-6 py-4 whitespace-nowrap font-semibold">₹{order.total_amount}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                  className={`px-2 py-1 rounded text-sm ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="in-transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// Notification Management Component
/* function NotificationManagement() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsData, statsData] = await Promise.all([
        api.notifications.getLogs({ limit: 20 }),
        api.notifications.getStats()
      ]);
      setLogs(logsData.logs || []);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading notifications...</div>;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <Mail className="text-blue-500 mb-2" size={32} />
            <p className="text-2xl font-bold">{stats.order_confirmations || 0}</p>
            <p className="text-sm text-gray-600">Order Confirmations</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <MessageSquare className="text-green-500 mb-2" size={32} />
            <p className="text-2xl font-bold">{stats.status_updates || 0}</p>
            <p className="text-sm text-gray-600">Status Updates</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <Phone className="text-purple-500 mb-2" size={32} />
            <p className="text-2xl font-bold">{stats.welcome_sent || 0}</p>
            <p className="text-sm text-gray-600">Welcome Messages</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <Bell className="text-orange-500 mb-2" size={32} />
            <p className="text-2xl font-bold">{stats.total_notifications || 0}</p>
            <p className="text-sm text-gray-600">Total Sent</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Recent


import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Package, Truck, BarChart3, Settings, LogOut, Search, Filter, Plus, Edit, Trash2, Eye, Menu, X, Home, Bell, DollarSign, Users, TrendingUp, Activity, Mail, MessageSquare, Phone } from 'lucide-react';

*/
// API Configuration
//const API_BASE_URL = 'http://localhost:5000/api';
//const TENANT_ID = 1;

// API Helper Functions
/* const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  auth: {
    login: (email, password) => 
      api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, tenantId: TENANT_ID }),
      }),
    register: (userData) => 
      api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...userData, tenantId: TENANT_ID }),
      }),
    getMe: () => api.request('/auth/me'),
  },

  products: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/products?${query}`);
    },
    getById: (id) => api.request(`/products/${id}`),
    create: (product) => api.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
    update: (id, product) => api.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON
*/
