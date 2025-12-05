import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await client.post('/auth/login', { username, password })
      localStorage.setItem('customer', JSON.stringify(res.data))
      navigate('/customer')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-light">
      <div className="brand-header">
        <div className="brand-icon">🍽️</div>
        <div className="brand-name">SD Foods</div>
        <div className="brand-tagline">Your favorite food, delivered fast</div>
      </div>

      <div className="auth-card-simple">
        <h2 className="auth-title-main">Welcome!</h2>
        <p className="auth-subtitle-main">
          Login or create an account to get started.
        </p>

        <div className="tab-switch">
          <button
            type="button"
            className="tab-btn active"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button
            type="button"
            className="tab-btn"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <label className="form-label">
            Username
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          <button
            className="btn btn-primary w-100"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}