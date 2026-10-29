import { useState } from 'react'
import { supabase } from './supabase.js'
import { usernameToEmail } from './lib.js'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })
    setBusy(false)
    if (error) {
      setMsg(
        /invalid login/i.test(error.message)
          ? 'Username atau password salah.'
          : error.message
      )
    }
  }

  return (
    <div className="center">
      <form className="card narrow" onSubmit={submit}>
        <h1>NOC Desk</h1>
        <p className="muted">Tiket pribadi untuk trouble di semua site.</p>
        <label>
          Username
          <input
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {msg && <p className="error">{msg}</p>}
        <button className="primary" disabled={busy}>
          {busy ? 'Tunggu…' : 'Masuk'}
        </button>
        <p className="muted">Belum punya akun? Minta superadmin untuk membuatkan.</p>
      </form>
    </div>
  )
}
