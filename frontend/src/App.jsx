import { useState } from 'react';

function App() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Procesando solicitud...');

    try {
      const endpoint = mode === 'login'
        ? 'http://127.0.0.1:5296/api/v1/auth/login'
        : 'http://127.0.0.1:5296/api/v1/auth/register';

      const payload = mode === 'login'
        ? { emailOrUsername: form.email, password: form.password }
        : {
            name: 'Usuario Demo',
            surname: 'Demo',
            username: form.username,
            email: form.email,
            password: form.password,
            phone: '00000000'
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(mode === 'login' ? `Login correcto. Token: ${data.token}` : 'Registro enviado correctamente.');
      } else {
        setMessage(data.message || 'Ocurrió un error');
      }
    } catch (error) {
      setMessage('No se pudo conectar con el servicio de autenticación');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 480, margin: '3rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 12, background: '#fff' }}>
      <h1>Canela Urbana</h1>
      <p>Primer sprint: autenticación y vista inicial.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={() => setMode('login')} style={{ flex: 1, padding: '0.7rem' }}>Login</button>
        <button onClick={() => setMode('register')} style={{ flex: 1, padding: '0.7rem' }}>Registro</button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Usuario"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={{ display: 'block', width: '100%', marginBottom: '0.8rem', padding: '0.7rem' }}
          />
        )}

        <input
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ display: 'block', width: '100%', marginBottom: '0.8rem', padding: '0.7rem' }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{ display: 'block', width: '100%', marginBottom: '0.8rem', padding: '0.7rem' }}
        />

        <button type="submit" style={{ width: '100%', padding: '0.8rem', cursor: 'pointer' }}>
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      </form>

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}

export default App;
