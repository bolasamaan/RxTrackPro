import { useState } from 'react';
import '../styles/auth.css';

export default function Auth({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pharmacyCode, setPharmacyCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/api/register' : '/api/login';
    const body = isRegister ? { username, password, pharmacy_code: pharmacyCode } : { username, password };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        // Make sure we pass both token and username to the parent
        onAuth({
          token: data.token,
          username: data.username
        });
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          className="auth-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {isRegister && (
          <input
            className="auth-input"
            type="text"
            placeholder="Pharmacy Code"
            value={pharmacyCode}
            onChange={e => setPharmacyCode(e.target.value)}
            required
          />
        )}
        <button className="auth-button" type="submit">
          {isRegister ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <button 
        className="auth-switch"
        onClick={() => setIsRegister(r => !r)}
      >
        {isRegister ? 'Already have an account? Sign In' : 'New user? Create account'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
