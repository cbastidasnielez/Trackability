import { useState } from 'react'
import { supabase } from '../lib/supabase'

const s = {
  mono: { fontVariantNumeric: "tabular-nums" },
  label: { fontSize: 11, color: "#71717A", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 },
}

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setMsg('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMsg('Revisa tu email para confirmar la cuenta')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090B", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#FAFAFA", letterSpacing: -0.5 }}>Control Financiero</div>
          <div style={{ fontSize: 13, color: "#52525B", marginTop: 4 }}>Tu sistema de fricción cero</div>
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: "100%", padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)", color: "#FAFAFA", fontSize: 15, fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 20, transition: "all 0.2s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar con Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: 11, color: "#52525B", textTransform: "uppercase", letterSpacing: 1 }}>o con email</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Email form */}
        <div onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#FAFAFA", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña (mín. 6 caracteres)"
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#FAFAFA", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
          <button onClick={handleEmail} disabled={loading || !email || !password} style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: email && password ? "#22C55E" : "rgba(255,255,255,0.04)",
            color: email && password ? "#000" : "#52525B",
            fontSize: 15, fontWeight: 700, cursor: email && password ? "pointer" : "default",
            transition: "all 0.2s",
          }}>
            {loading ? "Cargando..." : isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </div>

        <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMsg('') }} style={{
          width: "100%", padding: 14, marginTop: 10, background: "none", border: "none",
          color: "#71717A", fontSize: 13, cursor: "pointer",
        }}>
          {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </button>

        {error && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 12, textAlign: "center" }}>{error}</div>}
        {msg && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E", fontSize: 12, textAlign: "center" }}>{msg}</div>}
      </div>
    </div>
  )
}
