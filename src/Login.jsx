import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'minar7917') {
      onLogin();
    } else {
      setError('密碼錯誤，請重試');
      setPassword('');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔒 系統登入</h2>
        <p style={styles.subtitle}>請輸入密碼以存取儀表板</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入密碼"
            style={styles.input}
            autoFocus
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button}>登入</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    background: '#0f172a',
    fontFamily: 'sans-serif'
  },
  card: {
    background: '#1e293b',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  title: {
    color: '#ffffff',
    margin: '0 0 10px 0',
    fontSize: '24px'
  },
  subtitle: {
    color: '#94a3b8',
    margin: '0 0 30px 0',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#3b82f6',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  error: {
    color: '#ef4444',
    fontSize: '14px'
  }
};
