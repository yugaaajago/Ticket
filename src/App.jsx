import { useEffect, useState } from 'react'
import { supabase, configured } from './supabase.js'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!configured) {
      setReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!configured) {
    return (
      <div className="center">
        <div className="card narrow">
          <h1>NOC Desk</h1>
          <p>
            Supabase belum diatur. Isi <code>VITE_SUPABASE_URL</code> dan{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> di file <code>.env</code> (lokal) atau di
            Environment Variables Vercel, lalu jalankan ulang.
          </p>
        </div>
      </div>
    )
  }

  if (!ready) return <div className="center muted">Memuat…</div>
  if (!session) return <Login />
  return <Dashboard user={session.user} />
}
