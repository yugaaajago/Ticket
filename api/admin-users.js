// Vercel serverless function: kelola user. Hanya bisa dipakai oleh superadmin.
// Butuh env: SUPABASE_SERVICE_ROLE_KEY (RAHASIA, jangan diawali VITE_)
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const DOMAIN = 'nocdesk.app'
const USERNAME_RE = /^[a-z0-9._-]{3,30}$/

export default async function handler(req, res) {
  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Server belum diatur: SUPABASE_SERVICE_ROLE_KEY belum diisi di Vercel.' })
  }
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Belum login.' })

  const { data: caller, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !caller?.user) return res.status(401).json({ error: 'Sesi tidak valid.' })

  const { data: me } = await admin.from('profiles').select('role').eq('id', caller.user.id).maybeSingle()
  if (me?.role !== 'superadmin') return res.status(403).json({ error: 'Khusus superadmin.' })

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {}

  try {
    if (req.method === 'GET') {
      const { data, error } = await admin
        .from('profiles')
        .select('id, username, role, created_at')
        .order('created_at', { ascending: true })
      if (error) throw error
      return res.status(200).json({ users: data })
    }

    if (req.method === 'POST') {
      const username = String(body.username || '').trim().toLowerCase()
      const password = String(body.password || '')
      if (!USERNAME_RE.test(username))
        return res.status(400).json({ error: 'Username 3-30 karakter: huruf kecil, angka, titik, strip, garis bawah.' })
      if (password.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' })

      const { data: created, error } = await admin.auth.admin.createUser({
        email: `${username}@${DOMAIN}`,
        password,
        email_confirm: true,
      })
      if (error) {
        const exists = /already|registered|exists/i.test(error.message)
        return res.status(exists ? 409 : 400).json({ error: exists ? 'Username sudah dipakai.' : error.message })
      }
      const { error: pErr } = await admin
        .from('profiles')
        .insert({ id: created.user.id, username, role: 'user' })
      if (pErr) {
        await admin.auth.admin.deleteUser(created.user.id)
        return res.status(400).json({ error: pErr.message })
      }
      return res.status(201).json({ ok: true })
    }

    if (req.method === 'PATCH') {
      const password = String(body.password || '')
      if (!body.id) return res.status(400).json({ error: 'id wajib diisi.' })
      if (password.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' })
      const { error } = await admin.auth.admin.updateUserById(body.id, { password })
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      if (!body.id) return res.status(400).json({ error: 'id wajib diisi.' })
      if (body.id === caller.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akunmu sendiri.' })
      const { data: target } = await admin.from('profiles').select('role').eq('id', body.id).maybeSingle()
      if (target?.role === 'superadmin') return res.status(400).json({ error: 'Superadmin tidak bisa dihapus.' })
      const { error } = await admin.auth.admin.deleteUser(body.id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return res.status(405).json({ error: 'Metode tidak didukung.' })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan.' })
  }
}

function safeParse(s) {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}
