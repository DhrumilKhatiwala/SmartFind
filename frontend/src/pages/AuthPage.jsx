import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail) {
        setError(detail);
      } else if (err.message && err.message.includes('Network Error')) {
        setError('Unable to reach server. Please check your internet connection.');
      } else {
        setError(isLogin ? 'Incorrect email or password.' : 'Failed to create account. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="auth-wrapper" style={styles.wrapper}>
      <div className="auth-card" style={styles.card}>
        {/* Logo & Header */}
        <div style={styles.logoSection}>
          <div style={styles.brandRow}>
            <Logo size={40} />
            <h1 style={styles.logo}>SmartFind</h1>
          </div>
          <p style={styles.tagline}>AI-Powered Product Search</p>
        </div>

        {/* Tab Toggle */}
        <div style={styles.tabRow}>
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{ ...styles.tab, ...(isLogin ? styles.tabActive : {}) }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : {}) }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dhrumil"
                style={styles.input}
                required={!isLogin}
                minLength={3}
                maxLength={30}
                autoComplete="username"
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? 'Enter your password' : 'Min 6 characters'}
              style={styles.input}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={styles.spinner}></span>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p style={styles.switchText}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={toggleMode} style={styles.switchBtn}>
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </p>

        {/* Guest Divider */}
        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Guest Action */}
        <button
          type="button"
          onClick={handleGuestLogin}
          style={styles.guestBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Continue as Guest</span>
        </button>
        <p style={styles.guestDisclaimer}>
          Browse and test cart freely. Cart will be lost once this session ends.
        </p>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
    boxSizing: 'border-box',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logo: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.03em',
    fontFamily: "'Outfit', sans-serif",
  },
  tagline: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: 0,
  },
  tabRow: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    padding: '4px',
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    padding: '12px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.95rem',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '500',
    border: '1px solid #fecaca',
  },
  submitBtn: {
    padding: '13px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },
  switchText: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '0.85rem',
    color: '#64748b',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: 0,
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0 16px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.05em',
  },
  guestBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f8fafc',
    color: '#334155',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  guestDisclaimer: {
    textAlign: 'center',
    fontSize: '0.78rem',
    color: '#94a3b8',
    marginTop: '8px',
    lineHeight: '1.4',
  },
};

export default AuthPage;
