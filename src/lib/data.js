import { supabase } from './supabase'
import { DEFAULT_CUBOS } from './constants'

// ─── USER CUBOS ───
export async function getUserCubos(userId) {
  const { data, error } = await supabase
    .from('user_cubos')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data?.length > 0 ? data : null
}

export async function initUserCubos(userId) {
  const cubos = DEFAULT_CUBOS.map((c, i) => ({
    user_id: userId,
    cubo_id: c.id,
    emoji: c.emoji,
    nombre: c.nombre,
    presupuesto: c.presupuesto,
    tipo: c.tipo,
    color: c.color,
    sort_order: i,
  }))
  const { data, error } = await supabase.from('user_cubos').insert(cubos).select()
  if (error) throw error
  return data
}

export async function updateUserCubo(userId, cuboId, updates) {
  const { error } = await supabase
    .from('user_cubos')
    .update(updates)
    .eq('user_id', userId)
    .eq('cubo_id', cuboId)
  if (error) throw error
}

export async function addUserCubo(userId, cubo) {
  const { data, error } = await supabase.from('user_cubos').insert({ user_id: userId, ...cubo }).select()
  if (error) throw error
  return data[0]
}

export async function deleteUserCubo(userId, cuboId) {
  const { error } = await supabase.from('user_cubos').delete().eq('user_id', userId).eq('cubo_id', cuboId)
  if (error) throw error
}

// ─── MONTHLY DATA ───
export async function getMonthData(userId, month) {
  const { data, error } = await supabase
    .from('monthly_data')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertMonthData(userId, month, ingresos) {
  const { error } = await supabase
    .from('monthly_data')
    .upsert({ user_id: userId, month, ingresos }, { onConflict: 'user_id,month' })
  if (error) throw error
}

export async function getAllMonths(userId) {
  const { data, error } = await supabase
    .from('monthly_data')
    .select('*')
    .eq('user_id', userId)
    .order('month', { ascending: false })
  if (error) throw error
  return data || []
}

// ─── EXPENSES ───
export async function getExpenses(userId, month) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addExpense(userId, month, cuboId, cantidad, nota) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ user_id: userId, month, cubo_id: cuboId, cantidad, nota })
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

// ─── CUBO MONTHLY TOTALS (for fixed cubos) ───
export async function getCuboTotals(userId, month) {
  const { data, error } = await supabase
    .from('cubo_totals')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
  if (error) throw error
  return data || []
}

export async function upsertCuboTotal(userId, month, cuboId, total) {
  const { error } = await supabase
    .from('cubo_totals')
    .upsert({ user_id: userId, month, cubo_id: cuboId, total }, { onConflict: 'user_id,month,cubo_id' })
  if (error) throw error
}

// ─── ADMIN: AGGREGATED STATS ───
export async function getAdminStats() {
  const { data: users, error: e1 } = await supabase.from('profiles').select('id, email, display_name, created_at')
  if (e1) throw e1

  const { data: allMonths, error: e2 } = await supabase.from('monthly_data').select('*')
  if (e2) throw e2

  const { data: allExpenses, error: e3 } = await supabase.from('expenses').select('user_id, cantidad, month')
  if (e3) throw e3

  const { data: allTotals, error: e4 } = await supabase.from('cubo_totals').select('user_id, total, month')
  if (e4) throw e4

  return { users: users || [], allMonths: allMonths || [], allExpenses: allExpenses || [], allTotals: allTotals || [] }
}
