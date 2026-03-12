import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, ADMIN_EMAIL } from './lib/supabase'
import { curMKey, mLabel, EMOJI_OPTIONS, COLOR_OPTIONS, TIPO_OPTIONS } from './lib/constants'
import { getUserCubos, initUserCubos, updateUserCubo, addUserCubo, deleteUserCubo, getMonthData, upsertMonthData, getAllMonths, getExpenses, addExpense, deleteExpense, getCuboTotals, upsertCuboTotal } from './lib/data'
import { Ring, MiniRing } from './components/Rings'
import AuthPage from './pages/AuthPage'
import AdminPage from './pages/AdminPage'

const mono = { fontVariantNumeric: "tabular-nums" }
const card = { background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, marginBottom: 10, border: "1px solid rgba(255,255,255,0.06)" }
const label = { fontSize: 10, color: "#71717A", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("dashboard")
  const [cubos, setCubos] = useState([])
  const [curMonth, setCurMonth] = useState(curMKey())
  const [monthIngresos, setMonthIngresos] = useState(0)
  const [expenses, setExpenses] = useState([])
  const [cuboTotals, setCuboTotals] = useState({})
  const [allMonthsData, setAllMonthsData] = useState([])
  const [toast, setToast] = useState("")
  const [gasto, setGasto] = useState({ cubo: "", cantidad: "", nota: "" })
  const [ingInput, setIngInput] = useState("")
  const [editCubo, setEditCubo] = useState(null)
  const [editVal, setEditVal] = useState("")
  const [openHist, setOpenHist] = useState(curMKey())
  const [showAdmin, setShowAdmin] = useState(false)
  const [showCuboEditor, setShowCuboEditor] = useState(null)
  const [newCubo, setNewCubo] = useState({ emoji: "💰", nombre: "", presupuesto: 100, tipo: "diario", color: "#22C55E" })

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Ensure profile exists
  useEffect(() => {
    if (!session?.user) return
    const u = session.user
    supabase.from('profiles').upsert({
      id: u.id,
      email: u.email,
      display_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuario',
    }, { onConflict: 'id' }).then(() => {})
  }, [session])

  const userId = session?.user?.id
  const userEmail = session?.user?.email
  const isAdmin = userEmail === ADMIN_EMAIL

  // Load data
  const loadAll = useCallback(async () => {
    if (!userId) return
    try {
      let userCubos = await getUserCubos(userId)
      if (!userCubos) userCubos = await initUserCubos(userId)
      setCubos(userCubos.map(c => ({ id: c.cubo_id, emoji: c.emoji, nombre: c.nombre, presupuesto: c.presupuesto, tipo: c.tipo, color: c.color, sort_order: c.sort_order })))

      const md = await getMonthData(userId, curMonth)
      setMonthIngresos(md?.ingresos || 0)

      const exp = await getExpenses(userId, curMonth)
      setExpenses(exp)

      const ct = await getCuboTotals(userId, curMonth)
      setCuboTotals(Object.fromEntries(ct.map(t => [t.cubo_id, t.total])))

      const am = await getAllMonths(userId)
      setAllMonthsData(am)
    } catch (e) { console.error("Load error:", e) }
  }, [userId, curMonth])

  useEffect(() => { loadAll() }, [loadAll])

  // Compute
  const expByCubo = useMemo(() => {
    const m = {}
    expenses.forEach(e => { m[e.cubo_id] = (m[e.cubo_id] || 0) + e.cantidad })
    return m
  }, [expenses])

  const getCuboGasto = useCallback((cuboId) => (expByCubo[cuboId] || 0) + (cuboTotals[cuboId] || 0), [expByCubo, cuboTotals])
  const totGast = useMemo(() => cubos.reduce((a, c) => a + getCuboGasto(c.id), 0), [cubos, getCuboGasto])
  const totPres = useMemo(() => cubos.reduce((a, c) => a + c.presupuesto, 0), [cubos])
  const pctCons = monthIngresos > 0 ? ((monthIngresos - totGast) / monthIngresos) * 100 : 0
  const pctGastado = totPres > 0 ? (totGast / totPres) * 100 : 0
  const nsColor = pctCons >= 10 ? "#22C55E" : pctCons >= 0 ? "#EAB308" : "#EF4444"
  const budgetColor = pctGastado <= 80 ? "#22C55E" : pctGastado <= 100 ? "#EAB308" : "#EF4444"

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 1200) }

  // Actions
  const doAddGasto = async () => {
    const a = parseFloat(gasto.cantidad); if (!gasto.cubo || isNaN(a) || a <= 0) return
    await addExpense(userId, curMonth, gasto.cubo, a, gasto.nota)
    await upsertMonthData(userId, curMonth, monthIngresos || 0) // ensure month exists
    setGasto({ cubo: "", cantidad: "", nota: "" }); flash("Gasto registrado"); loadAll()
  }

  const doSaveIng = async () => {
    const a = parseFloat(ingInput); if (isNaN(a) || a <= 0) return
    await upsertMonthData(userId, curMonth, a); setIngInput(""); flash("Ingresos guardados"); loadAll()
  }

  const doSaveCuboFijo = async () => {
    const a = parseFloat(editVal); if (!editCubo || isNaN(a)) return
    await upsertCuboTotal(userId, curMonth, editCubo, a)
    await upsertMonthData(userId, curMonth, monthIngresos || 0)
    setEditCubo(null); setEditVal(""); flash("Cubo actualizado"); loadAll()
  }

  const doUndoLast = async () => {
    if (expenses.length === 0) return
    await deleteExpense(expenses[0].id); flash("Eliminado"); loadAll()
  }

  const doSaveNewCubo = async () => {
    if (!newCubo.nombre.trim()) return
    const cuboId = newCubo.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    await addUserCubo(userId, { cubo_id: cuboId, ...newCubo, sort_order: cubos.length })
    setNewCubo({ emoji: "💰", nombre: "", presupuesto: 100, tipo: "diario", color: "#22C55E" })
    setShowCuboEditor(null); flash("Cubo creado"); loadAll()
  }

  const doDeleteCubo = async (cuboId) => {
    if (!confirm("¿Eliminar este cubo?")) return
    await deleteUserCubo(userId, cuboId); flash("Cubo eliminado"); loadAll()
  }

  const doUpdateCuboConfig = async (cuboId, field, value) => {
    await updateUserCubo(userId, cuboId, { [field]: value }); loadAll()
  }

  const logout = async () => { await supabase.auth.signOut() }

  // History helper
  const getHistGasto = useCallback(async (month) => {
    try {
      const exp = await getExpenses(userId, month)
      const ct = await getCuboTotals(userId, month)
      const expTot = exp.reduce((a, e) => a + e.cantidad, 0)
      const fixTot = ct.reduce((a, t) => a + t.total, 0)
      return expTot + fixTot
    } catch { return 0 }
  }, [userId])

  // ─── RENDER ───
  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090B", color: "#fff" }}>
    <div style={{ textAlign: "center" }}><div style={{ fontSize: 42, marginBottom: 12 }}>💰</div><div style={{ opacity: .5, letterSpacing: 3, textTransform: "uppercase", fontSize: 10 }}>Cargando...</div></div>
  </div>

  if (!session) return <AuthPage />
  if (showAdmin && isAdmin) return <div style={{ minHeight: "100vh", background: "#09090B", color: "#E4E4E7", fontFamily: "-apple-system, sans-serif", maxWidth: 440, margin: "0 auto" }}><AdminPage onBack={() => setShowAdmin(false)} /></div>

  return (
    <div style={{ minHeight: "100vh", background: "#09090B", color: "#E4E4E7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", maxWidth: 440, margin: "0 auto" }}>

      {toast && <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "#22C55E", color: "#000", textAlign: "center", padding: 12, fontWeight: 600, fontSize: 13 }}>{toast}</div>}

      {/* HEADER */}
      <div style={{ padding: "16px 20px 14px", paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ ...label, fontSize: 9, letterSpacing: 3 }}>CONTROL FINANCIERO</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#FAFAFA", marginTop: 2 }}>{mLabel(curMonth)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ ...label, fontSize: 9, color: nsColor }}>NORTH STAR</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: nsColor, ...mono }}>{pctCons >= 0 ? "+" : ""}{pctCons.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{ display: "flex", background: "rgba(24,24,27,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 50 }}>
        {[
          { id: "dashboard", i: "📊", l: "Panel" },
          { id: "gasto", i: "＋", l: "Registrar", accent: true },
          { id: "cubos", i: "📦", l: "Cubos" },
          { id: "historial", i: "📈", l: "Historial" },
          { id: "config", i: "⚙️", l: "Ajustes" },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            flex: 1, padding: "10px 2px 8px", border: "none", cursor: "pointer",
            background: t.accent && view === t.id ? "rgba(34,197,94,0.1)" : "transparent",
            color: view === t.id ? (t.accent ? "#22C55E" : "#FAFAFA") : "#52525B",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: t.accent ? 22 : 16, fontWeight: t.accent ? 300 : 400 }}>{t.i}</span>
            <span style={{ fontSize: 9, letterSpacing: 0.5, fontWeight: view === t.id ? 600 : 400 }}>{t.l}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 32px" }}>

        {/* ═══ DASHBOARD ═══ */}
        {view === "dashboard" && (<div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20, paddingTop: 4 }}>
            <Ring pct={pctGastado} color={budgetColor} size={130} stroke={10}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#FAFAFA", ...mono }}>{totGast.toFixed(0)}€</div>
              <div style={{ fontSize: 9, color: "#71717A" }}>de {totPres}€</div>
            </Ring>
            <Ring pct={Math.max(0, pctCons)} color={nsColor} size={130} stroke={10}>
              <div style={{ fontSize: 24, fontWeight: 700, color: nsColor, ...mono }}>{pctCons.toFixed(1)}%</div>
              <div style={{ fontSize: 9, color: "#71717A" }}>conservado</div>
            </Ring>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { l: "Ingresos", v: monthIngresos, c: "#22C55E" },
              { l: "Gastos", v: totGast, c: "#EF4444" },
              { l: "Margen", v: monthIngresos - totGast, c: monthIngresos - totGast >= 0 ? "#22C55E" : "#EF4444" },
            ].map((k, i) => (
              <div key={i} style={{ ...card, flex: 1, textAlign: "center", padding: "12px 8px" }}>
                <div style={{ fontSize: 9, color: "#52525B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.l}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: k.c, ...mono }}>{k.v.toFixed(0)}€</div>
              </div>
            ))}
          </div>

          <div style={{ ...label, marginBottom: 10 }}>DETALLE POR CUBO</div>
          {cubos.map(c => {
            const g = getCuboGasto(c.id), p = c.presupuesto > 0 ? (g / c.presupuesto) * 100 : 0
            const rc = p <= 80 ? c.color : p <= 100 ? "#EAB308" : "#EF4444"
            return (
              <div key={c.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", marginBottom: 6 }}>
                <MiniRing pct={p} color={rc} size={40} stroke={3.5} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA" }}>{c.emoji} {c.nombre}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", ...mono }}>{g.toFixed(0)}€</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: "#52525B" }}>{c.tipo === "diario" ? "Diario" : c.tipo === "semanal" ? "Semanal" : "Fijo"}</span>
                    <span style={{ fontSize: 10, color: "#52525B", ...mono }}>quedan {Math.max(0, c.presupuesto - g).toFixed(0)}€ de {c.presupuesto}€</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>)}

        {/* ═══ REGISTRAR ═══ */}
        {view === "gasto" && (<div>
          <div style={{ ...card, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
            <div style={{ ...label, color: "#22C55E", marginBottom: 10 }}>INGRESOS DEL MES</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" inputMode="decimal" value={ingInput} onChange={e => setIngInput(e.target.value)}
                placeholder={monthIngresos > 0 ? `${monthIngresos}€` : "0"}
                style={{ flex: 1, padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(34,197,94,0.15)", background: "rgba(0,0,0,0.3)", color: "#FAFAFA", fontSize: 20, fontWeight: 700, outline: "none", ...mono }} />
              <button onClick={doSaveIng} style={{ padding: "14px 20px", borderRadius: 12, border: "none", background: "#22C55E", color: "#000", fontWeight: 700, fontSize: 18, cursor: "pointer" }}>✓</button>
            </div>
            {monthIngresos > 0 && <div style={{ marginTop: 6, fontSize: 11, color: "#4ADE80", ...mono }}>Actual: {monthIngresos.toFixed(0)}€</div>}
          </div>

          <div style={{ ...card, marginTop: 4 }}>
            <div style={{ ...label, color: "#F97316", marginBottom: 14 }}>REGISTRAR GASTO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
              {cubos.filter(c => c.tipo === "diario" || c.tipo === "semanal").map(c => {
                const sel = gasto.cubo === c.id, g = getCuboGasto(c.id)
                return (
                  <button key={c.id} onClick={() => setGasto(p => ({ ...p, cubo: c.id }))} style={{
                    padding: "12px 10px", borderRadius: 12, textAlign: "left",
                    border: sel ? `2px solid ${c.color}` : "1px solid rgba(255,255,255,0.06)",
                    background: sel ? `${c.color}12` : "rgba(255,255,255,0.02)",
                    color: "#FAFAFA", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 22 }}>{c.emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: sel ? "#FAFAFA" : "#A1A1AA" }}>{c.nombre}</div>
                      <div style={{ fontSize: 10, color: "#52525B", ...mono }}>{g.toFixed(0)} / {c.presupuesto}€</div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
              {[5, 10, 15, 20, 25, 30, 50, 100].map(a => (
                <button key={a} onClick={() => setGasto(p => ({ ...p, cantidad: String(a) }))} style={{
                  padding: "12px 0", borderRadius: 10,
                  border: gasto.cantidad === String(a) ? "2px solid #F97316" : "1px solid rgba(255,255,255,0.06)",
                  background: gasto.cantidad === String(a) ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.02)",
                  color: gasto.cantidad === String(a) ? "#F97316" : "#71717A",
                  fontSize: 15, fontWeight: 700, cursor: "pointer", ...mono,
                }}>{a}€</button>
              ))}
            </div>

            <input type="number" inputMode="decimal" value={gasto.cantidad} onChange={e => setGasto(p => ({ ...p, cantidad: e.target.value }))}
              placeholder="Otra cantidad" style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)", color: "#FAFAFA", fontSize: 20, fontWeight: 700, marginBottom: 8, boxSizing: "border-box", outline: "none", ...mono }} />
            <input type="text" value={gasto.nota} onChange={e => setGasto(p => ({ ...p, nota: e.target.value }))}
              placeholder="Nota (opcional)" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)", color: "#A1A1AA", fontSize: 13, marginBottom: 14, boxSizing: "border-box", outline: "none" }} />

            <button onClick={doAddGasto} disabled={!gasto.cubo || !gasto.cantidad} style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              background: gasto.cubo && gasto.cantidad ? "#22C55E" : "rgba(255,255,255,0.04)",
              color: gasto.cubo && gasto.cantidad ? "#000" : "#52525B",
              fontSize: 15, fontWeight: 700, cursor: gasto.cubo && gasto.cantidad ? "pointer" : "default",
            }}>Registrar gasto</button>
          </div>

          {expenses.length > 0 && (<div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={label}>ÚLTIMOS REGISTROS</div>
              <button onClick={doUndoLast} style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>↩ Deshacer último</button>
            </div>
            {expenses.slice(0, 6).map((e, i) => {
              const c = cubos.find(x => x.id === e.cubo_id)
              return (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, marginBottom: 3, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{c?.emoji || "❓"}</span>
                    <div>
                      <div style={{ fontSize: 12, color: "#D4D4D8", fontWeight: 500 }}>{c?.nombre || e.cubo_id}</div>
                      {e.nota && <div style={{ fontSize: 10, color: "#52525B" }}>{e.nota}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", ...mono }}>-{e.cantidad.toFixed(0)}€</div>
                    <div style={{ fontSize: 9, color: "#3F3F46" }}>{new Date(e.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}</div>
                  </div>
                </div>
              )
            })}
          </div>)}
        </div>)}

        {/* ═══ CUBOS ═══ */}
        {view === "cubos" && (<div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={label}>TUS CUBOS</div>
              <div style={{ fontSize: 11, color: "#3F3F46", marginTop: 2 }}>Toca un fijo para editar importe. Mantén para configurar.</div>
            </div>
            <button onClick={() => setShowCuboEditor("new")} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.06)", color: "#22C55E", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Cubo</button>
          </div>

          {/* New cubo form */}
          {showCuboEditor === "new" && (
            <div style={{ ...card, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", padding: 16, marginBottom: 12 }}>
              <div style={{ ...label, color: "#22C55E", marginBottom: 10 }}>NUEVO CUBO</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setNewCubo(p => ({ ...p, emoji: e }))} style={{ width: 36, height: 36, borderRadius: 8, border: newCubo.emoji === e ? "2px solid #22C55E" : "1px solid rgba(255,255,255,0.06)", background: newCubo.emoji === e ? "rgba(34,197,94,0.1)" : "transparent", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{e}</button>
                ))}
              </div>
              <input type="text" value={newCubo.nombre} onChange={e => setNewCubo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del cubo"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)", color: "#FAFAFA", fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="number" value={newCubo.presupuesto} onChange={e => setNewCubo(p => ({ ...p, presupuesto: parseFloat(e.target.value) || 0 }))} placeholder="Presupuesto"
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)", color: "#FAFAFA", fontSize: 14, outline: "none", ...mono }} />
                <select value={newCubo.tipo} onChange={e => setNewCubo(p => ({ ...p, tipo: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)", color: "#FAFAFA", fontSize: 13, outline: "none" }}>
                  {TIPO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={() => setNewCubo(p => ({ ...p, color: c }))} style={{ width: 28, height: 28, borderRadius: "50%", border: newCubo.color === c ? "3px solid #fff" : "2px solid transparent", background: c, cursor: "pointer" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={doSaveNewCubo} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#22C55E", color: "#000", fontWeight: 700, cursor: "pointer" }}>Crear cubo</button>
                <button onClick={() => setShowCuboEditor(null)} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#71717A", cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          )}

          {cubos.map(c => {
            const g = getCuboGasto(c.id), f = c.tipo === "fijo", ed = editCubo === c.id, p = c.presupuesto > 0 ? (g / c.presupuesto) * 100 : 0
            return (
              <div key={c.id} onClick={() => { if (f && !ed) { setEditCubo(c.id); setEditVal(String(cuboTotals[c.id] || c.presupuesto)) } }}
                style={{ ...card, padding: "12px 14px", marginBottom: 6, border: ed ? `2px solid ${c.color}44` : "1px solid rgba(255,255,255,0.06)", cursor: f ? "pointer" : "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MiniRing pct={p} color={c.color} size={40} stroke={3.5} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA" }}>{c.emoji} {c.nombre}</span>
                      {!ed && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, ...mono, color: "#FAFAFA" }}>{g.toFixed(0)}€</span>
                        <button onClick={e => { e.stopPropagation(); doDeleteCubo(c.id) }} style={{ background: "none", border: "none", color: "#3F3F46", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>×</button>
                      </div>}
                    </div>
                    <div style={{ fontSize: 10, color: f ? c.color : "#3F3F46", marginTop: 1 }}>{f ? (ed ? "Editando..." : "Toca para editar") : `Registro ${c.tipo}`}</div>
                  </div>
                </div>
                {ed && (
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    <input type="number" inputMode="decimal" value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
                      style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${c.color}33`, background: "rgba(0,0,0,0.3)", color: "#FAFAFA", fontSize: 20, fontWeight: 700, outline: "none", ...mono }} />
                    <button onClick={doSaveCuboFijo} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: c.color, color: "#000", fontWeight: 700, cursor: "pointer" }}>✓</button>
                    <button onClick={() => setEditCubo(null)} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#52525B", cursor: "pointer" }}>✕</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>)}

        {/* ═══ HISTORIAL ═══ */}
        {view === "historial" && (<div>
          <div style={{ ...label, marginBottom: 14 }}>EVOLUCIÓN MENSUAL</div>
          {allMonthsData.map(md => {
            const op = openHist === md.month
            return (
              <HistoryCard key={md.month} md={md} cubos={cubos} userId={userId} isOpen={op}
                onToggle={() => setOpenHist(op ? null : md.month)} />
            )
          })}
          {allMonthsData.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#3F3F46" }}>Empieza registrando tus ingresos y gastos del mes actual</div>}
        </div>)}

        {/* ═══ CONFIG ═══ */}
        {view === "config" && (<div>
          <div style={{ ...label, marginBottom: 12 }}>AJUSTES</div>

          <div style={card}>
            <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4 }}>Sesión</div>
            <div style={{ fontSize: 14, color: "#FAFAFA", fontWeight: 500 }}>{userEmail}</div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 8 }}>Mes activo</div>
            <select value={curMonth} onChange={e => setCurMonth(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)", color: "#FAFAFA", fontSize: 14, outline: "none" }}>
              {(() => { const o = []; const n = new Date(); for (let i = -2; i <= 12; i++) { const d = new Date(n.getFullYear(), n.getMonth() - i, 1); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; o.push(<option key={k} value={k}>{mLabel(k)}</option>) } return o })()}
            </select>
          </div>

          <div style={card}>
            <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 8 }}>Presupuestos</div>
            {cubos.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 12, color: "#D4D4D8" }}>{c.emoji} {c.nombre}</span>
                <span style={{ fontSize: 12, fontWeight: 600, ...mono, color: c.color }}>{c.presupuesto}€</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, ...mono, color: "#22C55E" }}>{totPres}€</span>
            </div>
          </div>

          <div style={{ ...card, background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}>
            <div style={{ fontSize: 12, color: "#A855F7", fontWeight: 600, marginBottom: 6 }}>📋 Ritual del domingo</div>
            <div style={{ fontSize: 11, color: "#71717A", lineHeight: 2 }}>
              1. Abrir apps bancarias → 2 min<br/>
              2. Registrar gastos por cubo → 3 min<br/>
              3. North Star ≥10%? → 1 min<br/>
              4. Si rojo → recortar 1 cubo → 1 min
            </div>
          </div>

          {isAdmin && <button onClick={() => setShowAdmin(true)} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.06)", color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>🔐 Panel Admin</button>}

          <button onClick={logout} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)", color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cerrar sesión</button>
        </div>)}
      </div>
    </div>
  )
}

// ─── HISTORY CARD (loads its own expense data) ───
function HistoryCard({ md, cubos, userId, isOpen, onToggle }) {
  const [gasto, setGasto] = useState(0)
  const [details, setDetails] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen || loaded) return
    ;(async () => {
      try {
        const exp = await getExpenses(userId, md.month)
        const ct = await getCuboTotals(userId, md.month)
        const byC = {}
        exp.forEach(e => { byC[e.cubo_id] = (byC[e.cubo_id] || 0) + e.cantidad })
        ct.forEach(t => { byC[t.cubo_id] = (byC[t.cubo_id] || 0) + t.total })
        const tot = Object.values(byC).reduce((a, b) => a + b, 0)
        setGasto(tot); setDetails(byC); setLoaded(true)
      } catch (e) { console.error(e) }
    })()
  }, [isOpen, loaded, userId, md.month])

  // Quick calc for closed state
  const p = md.ingresos > 0 && loaded ? ((md.ingresos - gasto) / md.ingresos) * 100 : null
  const color = p !== null ? (p >= 10 ? "#22C55E" : p >= 0 ? "#EAB308" : "#EF4444") : "#27272A"

  return (
    <div style={{ marginBottom: 6 }}>
      <div onClick={onToggle} style={{ ...card, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 0, padding: "12px 14px", borderRadius: isOpen ? "16px 16px 0 0" : 16, borderBottom: isOpen ? "none" : undefined, background: isOpen ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)" }}>
        <MiniRing pct={p !== null ? Math.max(0, p) : 0} color={color} size={42} stroke={3.5} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA" }}>{mLabel(md.month)}</div>
          <div style={{ fontSize: 10, color: "#52525B", fontVariantNumeric: "tabular-nums", marginTop: 1 }}>
            {md.ingresos.toFixed(0)}€ ing{loaded ? ` · ${gasto.toFixed(0)}€ gst` : ""}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
          {p !== null ? `${p >= 0 ? "+" : ""}${p.toFixed(1)}%` : "..."}
        </div>
      </div>
      {isOpen && loaded && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "8px 14px 14px" }}>
          {cubos.map(c => {
            const v = details[c.id] || 0
            if (v === 0) return null
            return (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 12, color: "#A1A1AA" }}>{c.emoji} {c.nombre}</span>
                <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "#D4D4D8" }}>{v.toFixed(0)}€</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
