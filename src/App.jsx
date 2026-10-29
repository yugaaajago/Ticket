import { useEffect, useState } from 'react'
import { supabase, configured } from './supabase.js'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import Admin from './Admin.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [view, setView] = useState('tickets')

  useEffect(() => {
    if (!configured) {
      setReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) {
        setProfile(null)
        setView('tickets')
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setProfileError('')
    supabase
      .from('profiles')
      .select('id, username, role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setProfileError(error.message)
        else if (!data) setProfileError('Akun ini belum punya profil. Hubungi superadmin.')
        else setProfile(data)
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

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

  if (profileError || !profile) {
    return (
      <div className="center">
        <div className="card narrow">
          <h1>NOC Desk</h1>
          <p className="error">{profileError || 'Memuat profil…'}</p>
          <button className="primary" onClick={() => supabase.auth.signOut()}>
            Keluar
          </button>
        </div>
      </div>
    )
  }

  if (view === 'admin' && profile.role === 'superadmin') {
    return <Admin onBack={() => setView('tickets')} />
  }
  return <Dashboard profile={profile} onOpenAdmin={() => setView('admin')} />
}
