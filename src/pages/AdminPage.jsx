import { useState, useEffect } from 'react'
import { getAdminStats } from '../lib/data'
import { Ring } from '../components/Rings'

const s = {
  card: { background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, marginBottom: 10, border: "1px solid rgba(255,255,255,0.06)" },
  label: { fontSize: 10, color: "#71717A", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 },
  mono: { fontVariantNumeric: "tabular-nums" },
}

export default function AdminPage({ onBack }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch (e) { setError(e.message) }
      setLoading(false)
    })()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#52525B" }}>Cargando estadísticas...</div>
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "#EF4444" }}>Error: {error}</div>

  const { users, allMonths, allExpenses, allTotals } = stats

  // Aggregate per user
  const userStats = users.map(u => {
    const months = allMonths.filter(m => m.user_id === u.id)
    const expenses = allExpenses.filter(e => e.user_id === u.id)
    const totals = allTotals.filter(t => t.user_id === u.id)
    const totalIng = months.reduce((a, m) => a + (m.ingresos || 0), 0)
    const totalGastExp = expenses.reduce((a, e) => a + (e.cantidad || 0), 0)
    const totalGastFix = totals.reduce((a, t) => a + (t.total || 0), 0)
    const totalGast = totalGastExp + totalGastFix
    const pct = totalIng > 0 ? ((totalIng - totalGast) / totalIng) * 100 : 0
    return { ...u, totalIng, totalGast, pct, monthCount: months.length, expenseCount: expenses.length }
  })

  const globalIng = userStats.reduce((a, u) => a + u.totalIng, 0)
  const globalGast = userStats.reduce((a, u) => a + u.totalGast, 0)
  const globalPct = globalIng > 0 ? ((globalIng - globalGast) / globalIng) * 100 : 0

  return (
    <div style={{ padding: "16px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#71717A", fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0 }}>
        ← Volver al panel
      </button>

      <div style={{ fontSize: 20, fontWeight: 700, color: "#FAFAFA", marginBottom: 4 }}>Panel Admin</div>
      <div style={{ fontSize: 12, color: "#52525B", marginBottom: 20 }}>{users.length} usuarios registrados</div>

      {/* Global ring */}
      <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 20, padding: 20 }}>
        <Ring pct={Math.max(0, globalPct)} color={globalPct >= 10 ? "#22C55E" : globalPct >= 0 ? "#EAB308" : "#EF4444"} size={90} stroke={8}>
          <div style={{ fontSize: 18, fontWeight: 700, color: globalPct >= 10 ? "#22C55E" : globalPct >= 0 ? "#EAB308" : "#EF4444", ...s.mono }}>{globalPct.toFixed(1)}%</div>
        </Ring>
        <div>
          <div style={{ ...s.label, marginBottom: 8, color: "#A855F7" }}>AGREGADO GLOBAL</div>
          <div style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 2 }}>Ingresos: <span style={{ color: "#22C55E", fontWeight: 700, ...s.mono }}>{globalIng.toFixed(0)}€</span></div>
          <div style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 2 }}>Gastos: <span style={{ color: "#EF4444", fontWeight: 700, ...s.mono }}>{globalGast.toFixed(0)}€</span></div>
          <div style={{ fontSize: 13, color: "#A1A1AA" }}>Balance: <span style={{ color: globalIng - globalGast >= 0 ? "#22C55E" : "#EF4444", fontWeight: 700, ...s.mono }}>{(globalIng - globalGast).toFixed(0)}€</span></div>
        </div>
      </div>

      {/* User list */}
      <div style={{ ...s.label, marginBottom: 10, marginTop: 16 }}>USUARIOS</div>
      {userStats.map(u => {
        const color = u.pct >= 10 ? "#22C55E" : u.pct >= 0 ? "#EAB308" : "#EF4444"
        return (
          <div key={u.id} style={{ ...s.card, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA" }}>{u.display_name || u.email}</div>
                <div style={{ fontSize: 10, color: "#3F3F46" }}>Registrado: {new Date(u.created_at).toLocaleDateString("es")}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color, ...s.mono }}>
                {u.totalIng > 0 ? `${u.pct.toFixed(1)}%` : "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#52525B" }}>
              <span>{u.monthCount} meses</span>
              <span>{u.expenseCount} gastos</span>
              <span style={{ color: "#22C55E", ...s.mono }}>{u.totalIng.toFixed(0)}€ ing</span>
              <span style={{ color: "#EF4444", ...s.mono }}>{u.totalGast.toFixed(0)}€ gst</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
