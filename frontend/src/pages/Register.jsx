import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../lib/api'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500&display=swap');
  .auth-page { min-height:100vh;background:#050810;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;position:relative;overflow:hidden; }
  .auth-bg-glow { position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(74,255,218,0.06) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none; }
  .auth-card { position:relative;z-index:1;width:100%;max-width:420px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:48px 40px;backdrop-filter:blur(20px); }
  .auth-logo { display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:36px; }
  .auth-logo-mark { width:30px;height:30px;background:linear-gradient(135deg,#4affda,#2eb8f0);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1rem; }
  .auth-logo-text { font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;color:#f0f2ff; }
  .auth-title { font-family:'Syne',sans-serif;font-size:1.7rem;font-weight:800;color:#ffffff;margin-bottom:6px;letter-spacing:-0.5px; }
  .auth-sub { font-size:0.875rem;color:rgba(240,242,255,0.4);margin-bottom:32px;font-weight:300; }
  .auth-label { display:block;font-size:0.8rem;font-weight:500;color:rgba(240,242,255,0.5);letter-spacing:0.5px;margin-bottom:8px; }
  .auth-input { width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:13px 16px;color:#f0f2ff;font-family:'Inter',sans-serif;font-size:0.9rem;outline:none;transition:border-color 0.2s;margin-bottom:20px; }
  .auth-input:focus { border-color:rgba(74,255,218,0.4); }
  .auth-input::placeholder { color:rgba(240,242,255,0.2); }
  .auth-btn { width:100%;background:linear-gradient(135deg,#1A6B8A,#4affda);color:#050810;padding:14px;border-radius:8px;font-family:'Inter',sans-serif;font-weight:600;font-size:0.95rem;border:none;cursor:pointer;transition:all 0.3s;margin-top:4px; }
  .auth-btn:hover { opacity:0.9;box-shadow:0 0 30px rgba(74,255,218,0.25);transform:translateY(-1px); }
  .auth-btn:disabled { opacity:0.5;cursor:not-allowed;transform:none; }
  .auth-error { background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.2);border-radius:8px;padding:12px 14px;color:#ff8080;font-size:0.85rem;margin-bottom:20px; }
  .auth-success { background:rgba(74,255,218,0.08);border:1px solid rgba(74,255,218,0.2);border-radius:8px;padding:12px 14px;color:#4affda;font-size:0.85rem;margin-bottom:20px; }
  .auth-footer { text-align:center;margin-top:28px;font-size:0.85rem;color:rgba(240,242,255,0.35); }
  .auth-footer a { color:#4affda;text-decoration:none;font-weight:500; }
  .auth-divider { border:none;border-top:1px solid rgba(255,255,255,0.06);margin:28px 0; }
`

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Пароль минимум 6 символов')
      return
    }
    setLoading(true)
    try {
      await register(email, password)
      setSuccess('Аккаунт создан! Перенаправляем...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="auth-page">
        <div className="auth-bg-glow" />
        <div className="auth-card">
          <Link to="/" className="auth-logo">
            <span className="auth-logo-mark">◈</span>
            <span className="auth-logo-text">Nexus</span>
          </Link>

          <h1 className="auth-title">Создать аккаунт</h1>
          <p className="auth-sub">Начните бесплатно — навсегда</p>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <label className="auth-label">EMAIL</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label className="auth-label">ПАРОЛЬ</label>
            <input
              className="auth-input"
              type="password"
              placeholder="минимум 6 символов"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button className="auth-btn" disabled={loading}>
              {loading ? 'Создаём...' : 'Создать аккаунт →'}
            </button>
          </form>

          <hr className="auth-divider" />
          <div className="auth-footer">
            Уже есть аккаунт?{' '}
            <Link to="/login">Войти</Link>
          </div>
        </div>
      </div>
    </>
  )
}