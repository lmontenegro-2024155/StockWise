import { useEffect, useState } from 'react';

const AUTH_API = 'http://127.0.0.1:5296/api/v1/auth/login';
const SERVICE_A = 'http://127.0.0.1:5301';
const SERVICE_B = 'http://127.0.0.1:5302/api/v1/service-b';

const embers = Array.from({ length: 16 }, (_, i) => ({
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 6,
  size: 2 + Math.random() * 2,
}));

const safeJson = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export default function App() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('sw-token') || '');
  const [view, setView] = useState('dashboard');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryReport, setCategoryReport] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    price: '0',
    stock: '0',
    minStock: '5',
    description: '',
  });

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [entryForm, setEntryForm] = useState({ productId: '', quantity: '0', note: '' });
  const [outputForm, setOutputForm] = useState({ productId: '', quantity: '0', note: '' });

  useEffect(() => {
    if (token) {
      loadAll();
    }
  }, [token]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const request = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, ...authHeaders() },
    });

    if (!res.ok) {
      const payload = await safeJson(res);
      throw new Error(payload?.message || payload || `HTTP ${res.status}`);
    }

    return safeJson(res);
  };

  const loadProducts = async () => {
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.set('search', searchTerm);
      if (filterCategory) query.set('category', filterCategory);
      const data = await request(`${SERVICE_A}/products?${query.toString()}`);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load products error', err);
      setError(err.message);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await request(`${SERVICE_A}/categories`);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load categories error', err);
      setError(err.message);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await request(`${SERVICE_B}/reports/summary`);
      setSummary(data);
    } catch (err) {
      console.error('Load summary error', err);
      setError(err.message);
    }
  };

  const loadReports = async () => {
    try {
      const [low, out, top, categoriesReportData, alertData] = await Promise.all([
        request(`${SERVICE_B}/alerts/low-stock`),
        request(`${SERVICE_B}/alerts/out-of-stock`),
        request(`${SERVICE_B}/reports/top-products`),
        request(`${SERVICE_B}/reports/categories`),
        request(`${SERVICE_B}/reports/summary`).then((data) => data),
      ]);

      setLowStock(Array.isArray(low.products) ? low.products : []);
      setOutOfStock(Array.isArray(out.products) ? out.products : []);
      setTopProducts(Array.isArray(top.products) ? top.products : []);
      setCategoryReport(Array.isArray(categoriesReportData.categories) ? categoriesReportData.categories : []);
      // keep summary also in state
      setSummary(alertData);
    } catch (err) {
      console.error('Load reports error', err);
      setError(err.message);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await request(`${SERVICE_B}/alerts`);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load alerts error', err);
      setError(err.message);
    }
  };

  const loadAll = async () => {
    setError('');
    await Promise.all([loadProducts(), loadCategories(), loadSummary(), loadReports(), loadAlerts()]);
  };

  const login = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    if (!email.trim() || !password) {
      setError('Completa usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EmailOrUsername: email.trim(), Password: password }),
      });
      const body = await safeJson(res);
      if (!res.ok) {
        throw new Error(body?.message || 'Error al iniciar sesión');
      }

      const tokenValue = body?.data?.token || body?.token;
      if (!tokenValue) {
        throw new Error('Token no recibido');
      }

      setToken(tokenValue);
      setStatusMessage('Sesión iniciada correctamente.');
      setPassword('');
      if (remember) {
        localStorage.setItem('sw-token', tokenValue);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('sw-token');
    setProducts([]);
    setCategories([]);
    setSummary(null);
    setLowStock([]);
    setOutOfStock([]);
    setTopProducts([]);
    setCategoryReport([]);
    setAlerts([]);
    setView('dashboard');
    setStatusMessage('Sesión cerrada.');
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    try {
      const body = {
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        description: newProduct.description,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        minStock: Number(newProduct.minStock),
      };
      await request(`${SERVICE_A}/products`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setStatusMessage('Producto creado correctamente.');
      setNewProduct({ name: '', sku: '', category: '', price: '0', stock: '0', minStock: '5', description: '' });
      await loadProducts();
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    try {
      await request(`${SERVICE_A}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name: newCategory.name, description: newCategory.description }),
      });
      setStatusMessage('Categoría creada correctamente.');
      setNewCategory({ name: '', description: '' });
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInventoryEntry = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    try {
      await request(`${SERVICE_A}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          productId: entryForm.productId,
          quantity: Number(entryForm.quantity),
          note: entryForm.note,
        }),
      });
      setStatusMessage('Entrada registrada.');
      setEntryForm({ productId: '', quantity: '0', note: '' });
      await loadProducts();
      await loadReports();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInventoryOutput = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    try {
      await request(`${SERVICE_A}/outputs`, {
        method: 'POST',
        body: JSON.stringify({
          productId: outputForm.productId,
          quantity: Number(outputForm.quantity),
          note: outputForm.note,
        }),
      });
      setStatusMessage('Salida registrada.');
      setOutputForm({ productId: '', quantity: '0', note: '' });
      await loadProducts();
      await loadReports();
    } catch (err) {
      setError(err.message);
    }
  };

  const activeSection = () => {
    switch (view) {
      case 'inventory':
        return (
          <section className="panel">
            <div className="panel-header">
              <h2>Inventario</h2>
              <button className="mini-btn" onClick={loadProducts}>Actualizar</button>
            </div>
            <div className="filters-row">
              <input
                type="text"
                placeholder="Buscar por nombre o descripción"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div className="card">
                <h3>Lista de productos</h3>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id}>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>{product.stock}</td>
                          <td>{product.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <h3>Crear producto</h3>
                <form onSubmit={handleProductSubmit} className="mini-form">
                  <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nombre" />
                  <input value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} placeholder="SKU" />
                  <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                    <option value="">Selecciona categoría</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Precio" />
                  <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="Existencia" />
                  <input type="number" value={newProduct.minStock} onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })} placeholder="Stock mínimo" />
                  <textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Descripción" rows="3" />
                  <button type="submit" className="mini-btn">Crear producto</button>
                </form>
              </div>
            </div>
          </section>
        );
      case 'categories':
        return (
          <section className="panel">
            <div className="panel-header">
              <h2>Categorías</h2>
              <button className="mini-btn" onClick={loadCategories}>Actualizar</button>
            </div>
            <div className="grid-2">
              <div className="card">
                <h3>Lista de categorías</h3>
                <ul className="list-box">
                  {categories.map((cat) => (
                    <li key={cat._id || cat.name}>{cat.name}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3>Crear categoría</h3>
                <form onSubmit={handleCategorySubmit} className="mini-form">
                  <input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Nombre de categoría" />
                  <textarea value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} placeholder="Descripción" rows="3" />
                  <button type="submit" className="mini-btn">Crear categoría</button>
                </form>
              </div>
            </div>
          </section>
        );
      case 'movements':
        return (
          <section className="panel">
            <div className="panel-header">
              <h2>Entradas y salidas</h2>
            </div>
            <div className="grid-2">
              <div className="card">
                <h3>Registrar entrada</h3>
                <form onSubmit={handleInventoryEntry} className="mini-form">
                  <select value={entryForm.productId} onChange={(e) => setEntryForm({ ...entryForm, productId: e.target.value })}>
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>{product.name}</option>
                    ))}
                  </select>
                  <input type="number" value={entryForm.quantity} onChange={(e) => setEntryForm({ ...entryForm, quantity: e.target.value })} placeholder="Cantidad" />
                  <textarea value={entryForm.note} onChange={(e) => setEntryForm({ ...entryForm, note: e.target.value })} placeholder="Nota" rows="3" />
                  <button type="submit" className="mini-btn">Registrar entrada</button>
                </form>
              </div>
              <div className="card">
                <h3>Registrar salida</h3>
                <form onSubmit={handleInventoryOutput} className="mini-form">
                  <select value={outputForm.productId} onChange={(e) => setOutputForm({ ...outputForm, productId: e.target.value })}>
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>{product.name}</option>
                    ))}
                  </select>
                  <input type="number" value={outputForm.quantity} onChange={(e) => setOutputForm({ ...outputForm, quantity: e.target.value })} placeholder="Cantidad" />
                  <textarea value={outputForm.note} onChange={(e) => setOutputForm({ ...outputForm, note: e.target.value })} placeholder="Nota" rows="3" />
                  <button type="submit" className="mini-btn">Registrar salida</button>
                </form>
              </div>
            </div>
          </section>
        );
      case 'reports':
        return (
          <section className="panel">
            <div className="panel-header">
              <h2>Reportes</h2>
              <button className="mini-btn" onClick={loadReports}>Actualizar</button>
            </div>
            <div className="grid-3">
              <div className="stat-card">
                <span>Total productos</span>
                <strong>{summary?.totalProducts ?? '-'}</strong>
              </div>
              <div className="stat-card">
                <span>Bajos en stock</span>
                <strong>{summary?.lowStockCount ?? '-'}</strong>
              </div>
              <div className="stat-card">
                <span>Agotados</span>
                <strong>{summary?.outOfStockCount ?? '-'}</strong>
              </div>
            </div>
            <div className="grid-2">
              <div className="card">
                <h3>Top productos vendidos</h3>
                <ul className="list-box">
                  {topProducts.map((prod) => (
                    <li key={prod.productId}>
                      <strong>{prod.name}</strong> ({prod.category}) - Vendido: {prod.totalSold}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3>Resumen por categoría</h3>
                <ul className="list-box">
                  {categoryReport.map((cat) => (
                    <li key={cat.category}>
                      <strong>{cat.category}</strong> - Productos: {cat.productCount} - Stock total: {cat.totalStock}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="card">
              <h3>Alertas de inventario</h3>
              <ul className="list-box">
                {lowStock.slice(0, 10).map((product) => (
                  <li key={product._id}>{product.name} - stock: {product.stock}</li>
                ))}
              </ul>
            </div>
          </section>
        );
      case 'alerts':
        return (
          <section className="panel">
            <div className="panel-header">
              <h2>Alertas guardadas</h2>
              <button className="mini-btn" onClick={loadAlerts}>Actualizar</button>
            </div>
            <div className="card">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Mensaje</th>
                      <th>Nivel</th>
                      <th>Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert._id}>
                        <td>{alert.productName || 'N/A'}</td>
                        <td>{alert.message}</td>
                        <td>{alert.level}</td>
                        <td>{new Date(alert.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      default:
        return (
          <section className="panel">
            <div className="panel-header">
              <h2>Panel principal</h2>
              <button className="mini-btn" onClick={loadAll}>Actualizar todo</button>
            </div>
            <div className="grid-3">
              <div className="stat-card">
                <span>Productos</span>
                <strong>{summary?.totalProducts ?? products.length}</strong>
              </div>
              <div className="stat-card">
                <span>Categorías</span>
                <strong>{categories.length}</strong>
              </div>
              <div className="stat-card">
                <span>Alertas</span>
                <strong>{alerts.length}</strong>
              </div>
            </div>
            <div className="grid-2">
              <div className="card">
                <h3>Productos bajos en stock</h3>
                <ul className="list-box">
                  {lowStock.slice(0, 8).map((product) => (
                    <li key={product._id}>{product.name} - {product.stock} unidades</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3>Productos agotados</h3>
                <ul className="list-box">
                  {outOfStock.slice(0, 8).map((product) => (
                    <li key={product._id}>{product.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
    }
  };

  if (!token) {
    return (
      <div className="rv-stage relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        <style>{`
          .rv-stage{display:flex;align-items:center;justify-content:center;min-height:100vh;width:100vw;margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#f2f4f0;background:linear-gradient(180deg,#08111f 0%,#0c1a2c 42%,#08111f 100%);}
          .rv-card{background:rgba(16,19,26,0.72);border:1px solid rgba(255,255,255,0.12);backdrop-filter:blur(18px);box-shadow:0 30px 80px rgba(0,0,0,0.5);color:#f2f4f0;border-radius:24px;width:min(92vw,420px);padding:2rem;}
          .rv-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#f2f4f0;border-radius:14px;outline:none;padding:0.95rem 1rem;transition:border-color 0.2s ease,box-shadow 0.2s ease;width:100%;}
          .rv-btn{width:100%;background:linear-gradient(135deg,#6ec96a,#3f8a3d);border:none;border-radius:16px;color:#0c1a0b;font-weight:700;font-size:14px;padding:14px 16px;cursor:pointer;}
          .rv-btn:disabled{opacity:0.6;cursor:not-allowed;}
          .rv-toggle-pass{position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:none;border:none;color:#aab3ac;cursor:pointer;font-weight:700;}
          .rv-message{font-size:12.5px;color:#fca5a5;margin:0;}
        `}</style>
        <div className="rv-card">
          <h1 className="rv-title" style={{ marginBottom: '1rem' }}>Inicio de sesión</h1>
          <form onSubmit={login} style={{ display: 'grid', gap: '1rem' }}>
            <input className="rv-input" type="text" placeholder="Usuario o correo" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ position: 'relative' }}>
              <input className="rv-input" type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: '4.5rem' }} />
              <button type="button" className="rv-toggle-pass" onClick={() => setShowPass((v) => !v)}>{showPass ? 'Ocultar' : 'Mostrar'}</button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#aab3ac' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Recordarme
            </label>
            {error && <p className="rv-message">{error}</p>}
            {statusMessage && <p className="rv-message" style={{ color: '#a9e37f' }}>{statusMessage}</p>}
            <button type="submit" className="rv-btn" disabled={loading}>{loading ? 'Iniciando...' : 'Iniciar sesión'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{`
        .app-shell{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#eef2ff;background:linear-gradient(180deg, #05101d 0%, #081828 42%, #08131f 100%);min-height:100vh;padding:1.2rem;}
        .app-grid{display:grid;grid-template-columns:minmax(280px,380px) minmax(0,1fr);gap:1.25rem;align-items:start;}
        .app-sidebar{display:flex;flex-direction:column;gap:1rem;}
        .sidebar-card{background:rgba(8,18,33,0.92);border:1px solid rgba(95,149,255,0.1);border-radius:32px;padding:1.6rem;box-shadow:0 32px 80px rgba(0,0,0,0.22);backdrop-filter:blur(18px);}
        .sidebar-title{margin:0;font-size:2.1rem;line-height:1.05;color:#f8fafc;letter-spacing:-0.03em;}
        .sidebar-subtitle{margin:1rem 0 0;color:#a9b6d9;font-size:0.97rem;line-height:1.8;max-width:15rem;}
        .sidebar-actions{display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;margin-top:1.35rem;}
        .status-badge{padding:0.65rem 1rem;border-radius:999px;font-weight:700;font-size:0.92rem;background:rgba(34,197,94,0.12);color:#a8f8d6;border:1px solid rgba(34,197,94,0.22);}
        .logout-btn{background:rgba(255,255,255,0.08);color:#e2e8f0;border:none;padding:0.75rem 1rem;border-radius:999px;cursor:pointer;transition:transform 0.2s ease,background 0.2s ease;}
        .logout-btn:hover{transform:translateY(-1px);background:rgba(255,255,255,0.14);}
        .app-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.75rem;margin-top:1.5rem;}
        .nav-pill{display:inline-flex;align-items:center;justify-content:center;gap:0.35rem;padding:0.95rem 1rem;border-radius:18px;background:rgba(255,255,255,0.04);color:#d8e2ff;border:1px solid rgba(255,255,255,0.08);cursor:pointer;font-weight:600;transition:all 0.22s ease;}
        .nav-pill.active{background:linear-gradient(135deg,#39b3ff,#4ade80);color:#031b21;border-color:rgba(255,255,255,0.18);box-shadow:0 16px 40px rgba(35,142,255,0.15);}
        .nav-pill:hover{background:rgba(255,255,255,0.08);}
        .app-main{display:flex;flex-direction:column;gap:1rem;}
        .topbar-card{background:rgba(6,12,25,0.9);border:1px solid rgba(255,255,255,0.08);border-radius:32px;padding:1.45rem 1.6rem;box-shadow:0 32px 90px rgba(0,0,0,0.2);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;}
        .topbar-title{margin:0;font-size:1.3rem;color:#f8fafc;font-weight:700;}
        .topbar-caption{margin:0;color:#8ca1c6;font-size:0.95rem;}
        .content{display:grid;gap:1rem;}
        .panel{background:rgba(6,12,25,0.9);border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:1.5rem;box-shadow:0 24px 70px rgba(0,0,0,0.2);}
        .section-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.35rem;}
        .section-header h2{margin:0;color:#f8fafc;font-size:1.35rem;}
        .mini-btn{background:linear-gradient(135deg,#4ade80,#22c55e);color:#042f14;border:none;border-radius:999px;padding:0.9rem 1.4rem;cursor:pointer;font-weight:700;transition:transform 0.2s ease,box-shadow 0.2s ease;}
        .mini-btn:hover{transform:translateY(-1px);box-shadow:0 16px 35px rgba(34,197,94,0.25);}
        .grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;}
        .grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;}
        .card{background:rgba(12,20,39,0.94);border:1px solid rgba(80,157,255,0.08);border-radius:26px;padding:1.35rem;box-shadow:0 20px 45px rgba(0,0,0,0.14);}
        .stat-card{background:linear-gradient(135deg,#15803d 0%,#0891b2 100%);border-radius:24px;padding:1.35rem;color:#f8fafc;min-height:140px;display:flex;flex-direction:column;justify-content:space-between;}
        .stat-card strong{display:block;font-size:2rem;margin-top:0.8rem;letter-spacing:-0.03em;}
        .table-scroll{overflow:auto;max-height:360px;border-radius:20px;}
        table{width:100%;border-collapse:collapse;color:#e2e8f0;}
        th,td{padding:0.95rem 0.85rem;text-align:left;border-bottom:1px solid rgba(255,255,255,0.08);}
        th{color:#94a3b8;font-size:0.82rem;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;}
        .mini-form{display:grid;gap:0.95rem;}
        .mini-form input,.narrow-input,.mini-form select,.mini-form textarea{width:100%;padding:0.95rem 1rem;border-radius:18px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#f1f5f9;outline:none;transition:border-color 0.2s ease,box-shadow 0.2s ease;}
        .mini-form input:focus,.mini-form select:focus,.mini-form textarea:focus{border-color:rgba(74,222,128,0.7);box-shadow:0 0 0 4px rgba(16,185,129,0.12);}
        .mini-form textarea{resize:vertical;min-height:100px;}
        .list-box{list-style:none;padding:0;margin:0;display:grid;gap:0.75rem;max-height:300px;overflow:auto;}
        .list-box li{background:rgba(255,255,255,0.04);padding:1rem;border-radius:18px;}
        .filters-row{display:grid;grid-template-columns:1fr minmax(220px,300px);gap:0.85rem;margin-bottom:1rem;}
        .filters-row input,.filters-row select{padding:0.95rem 1rem;border-radius:18px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#f1f5f9;}
        .message-area{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.25rem;border-radius:18px;background:rgba(34,197,94,0.14);color:#d1fae5;margin-bottom:1rem;}
        .message-area.error{background:rgba(248,113,113,0.18);color:#fecaca;}
        .status-chip{background:rgba(15,23,42,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:0.75rem 1rem;color:#cbd5e1;font-size:0.95rem;}
      `}</style>
      <div className="app-grid">
        <aside className="app-sidebar">
          <div className="sidebar-card">
            <h1 className="sidebar-title">Inventory OS</h1>
            <p className="sidebar-subtitle">Gestiona inventario, categorías, entradas, salidas y alertas con una interfaz más clara y profesional.</p>
            <div className="sidebar-actions">
              <span className="status-badge">Conectado</span>
              <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
            </div>
            <div className="app-nav">
              {['dashboard', 'inventory', 'categories', 'movements', 'reports', 'alerts'].map((tab) => (
                <button key={tab} className={`nav-pill ${view === tab ? 'active' : ''}`} onClick={() => setView(tab)}>
                  {tab === 'dashboard' ? 'Dashboard' : tab === 'inventory' ? 'Inventario' : tab === 'categories' ? 'Categorías' : tab === 'movements' ? 'Movimientos' : tab === 'reports' ? 'Reportes' : 'Alertas'}
                </button>
              ))}
            </div>
          </div>
        </aside>
        <main className="app-main">
          <div className="topbar-card">
            <div>
              <p className="topbar-caption">Bienvenido al panel de control</p>
              <h2 className="topbar-title">Resumen rápido</h2>
            </div>
            <button className="mini-btn" onClick={loadAll}>Actualizar todo</button>
          </div>
          {(error || statusMessage) && (
            <div className={`message-area ${error ? 'error' : ''}`}>
              <span>{error || statusMessage}</span>
              {error && <button className="mini-btn" onClick={() => setError('')}>Cerrar</button>}
            </div>
          )}
          <div className="content">{activeSection()}</div>
        </main>
      </div>
    </div>
  );
}
