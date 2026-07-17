import { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://127.0.0.1:5296/api/v1';

const emptyProduct = {
  name: '',
  description: '',
  price: 0,
  stock: 0
};

const emptyMovement = {
  productId: '',
  type: 'entry',
  quantity: 1,
  note: ''
};

function App() {
  const [mode, setMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '' });
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [productForm, setProductForm] = useState(emptyProduct);

  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [movements, setMovements] = useState([]);
  const [report, setReport] = useState(null);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage('Procesando autenticacion...');

    try {
      if (mode === 'login') {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailOrUsername: authForm.email,
            password: authForm.password
          })
        });

        const data = await response.json();
        if (!response.ok) {
          setMessage(data.message || 'No fue posible iniciar sesion');
          return;
        }

        setToken(data.token);
        setMessage('Sesion iniciada en StockWise');
      } else {
        const formData = new FormData();
        formData.append('name', 'Usuario');
        formData.append('surname', 'StockWise');
        formData.append('username', authForm.username);
        formData.append('email', authForm.email);
        formData.append('password', authForm.password);
        formData.append('phone', '00000000');

        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (!response.ok) {
          setMessage(data.message || 'No fue posible registrar el usuario');
          return;
        }

        setMessage('Registro completado. Ahora inicia sesion.');
        setMode('login');
      }
    } catch {
      setMessage('No se pudo conectar con el servicio de autenticacion');
    }
  };

  const loadProducts = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/products`, {
        headers: authHeaders
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      }
    } catch {
      setMessage('Error al cargar productos');
    }
  };

  const loadReport = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/reports/summary?threshold=10`, {
        headers: authHeaders
      });
      const data = await response.json();
      if (response.ok) {
        setReport(data);
      }
    } catch {
      setMessage('Error al cargar reportes');
    }
  };

  useEffect(() => {
    loadProducts();
    loadReport();
  }, [token]);

  const selectProduct = (product) => {
    setSelectedId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock
    });
    setMovementForm((prev) => ({ ...prev, productId: product.id }));
  };

  const saveProduct = async () => {
    if (!token) return;

    const hasSelection = Boolean(selectedId);
    const method = hasSelection ? 'PUT' : 'POST';
    const url = hasSelection
      ? `${API_BASE}/products/${selectedId}`
      : `${API_BASE}/products`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...productForm,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          isActive: true
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.message || 'No se pudo guardar el producto');
        return;
      }

      setMessage(hasSelection ? 'Producto actualizado' : 'Producto creado');
      setSelectedId('');
      setProductForm(emptyProduct);
      await loadProducts();
      await loadReport();
    } catch {
      setMessage('Error de red al guardar producto');
    }
  };

  const deleteProduct = async () => {
    if (!selectedId || !token) return;

    try {
      const response = await fetch(`${API_BASE}/products/${selectedId}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (!response.ok) {
        setMessage('No se pudo eliminar el producto');
        return;
      }

      setMessage('Producto eliminado');
      setSelectedId('');
      setProductForm(emptyProduct);
      setMovementForm(emptyMovement);
      setMovements([]);
      await loadProducts();
      await loadReport();
    } catch {
      setMessage('Error de red al eliminar producto');
    }
  };

  const registerMovement = async () => {
    if (!token || !movementForm.productId) return;

    try {
      const response = await fetch(`${API_BASE}/inventory/movements`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...movementForm,
          quantity: Number(movementForm.quantity)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'No se pudo registrar el movimiento');
        return;
      }

      setMessage(`Movimiento registrado (${data.type})`);
      setMovementForm((prev) => ({ ...prev, quantity: 1, note: '' }));
      await loadProducts();
      await loadProductMovements(data.productId);
      await loadReport();
    } catch {
      setMessage('Error de red al registrar movimiento');
    }
  };

  const loadProductMovements = async (productId) => {
    if (!token || !productId) return;

    try {
      const response = await fetch(`${API_BASE}/inventory/movements/${productId}`, {
        headers: authHeaders
      });

      const data = await response.json();
      if (response.ok) {
        setMovements(data);
      }
    } catch {
      setMessage('No se pudo cargar el historial de inventario');
    }
  };

  return (
    <main className="page">
      <section className="card auth-card">
        <h1>StockWise</h1>
        <p>Autenticacion, inventario y reportes del Sprint 2.</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Registro</button>
        </div>

        <form onSubmit={handleAuthSubmit} className="stack">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Usuario"
              value={authForm.username}
              onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
            />
          )}

          <input
            type="text"
            placeholder="Correo o usuario"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Contrasena"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
          />

          <button type="submit">{mode === 'login' ? 'Ingresar' : 'Crear cuenta'}</button>
        </form>
      </section>

      {token && (
        <>
          <section className="card">
            <h2>Productos</h2>
            <div className="grid-2">
              <div className="stack">
                <input placeholder="Nombre" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                <input placeholder="Descripcion" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                <input type="number" placeholder="Precio" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                <input type="number" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
                <div className="row">
                  <button type="button" onClick={saveProduct}>{selectedId ? 'Actualizar' : 'Crear'}</button>
                  <button type="button" className="danger" onClick={deleteProduct} disabled={!selectedId}>Eliminar</button>
                </div>
              </div>

              <div className="list">
                {products.map((product) => (
                  <button key={product.id} className="list-item" onClick={() => { selectProduct(product); loadProductMovements(product.id); }}>
                    <strong>{product.name}</strong>
                    <span>Stock: {product.stock}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Movimientos de inventario</h2>
            <div className="grid-2">
              <div className="stack">
                <select value={movementForm.productId} onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}>
                  <option value="">Selecciona producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}>
                  <option value="entry">Entrada</option>
                  <option value="exit">Salida</option>
                </select>

                <input type="number" min="1" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} />
                <input placeholder="Nota" value={movementForm.note} onChange={(e) => setMovementForm({ ...movementForm, note: e.target.value })} />
                <button type="button" onClick={registerMovement}>Registrar movimiento</button>
              </div>

              <div className="list">
                {movements.map((m) => (
                  <div key={m.id} className="list-item passive">
                    <strong>{m.type === 'entry' ? 'Entrada' : 'Salida'} ({m.quantity})</strong>
                    <span>{m.productName} | {m.previousStock}{' -> '}{m.newStock}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Alertas y reporte inicial</h2>
            <button type="button" onClick={loadReport}>Actualizar reporte</button>
            {report && (
              <div className="stack">
                <p>Total productos: {report.totalProducts}</p>
                <p>Productos con bajo stock: {report.lowStockCount}</p>
                <div className="list">
                  {(report.lowStockProducts || []).map((p) => (
                    <div key={p.id} className="list-item passive">
                      <strong>{p.name}</strong>
                      <span>Stock actual: {p.stock}</span>
                    </div>
                  ))}
                </div>
                <div className="list">
                  {(report.services || []).map((s) => (
                    <div key={s.service} className="list-item passive">
                      <strong>{s.service}</strong>
                      <span>{s.status} - {s.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {message && <p className="message">{message}</p>}
    </main>
  );
}

export default App;
