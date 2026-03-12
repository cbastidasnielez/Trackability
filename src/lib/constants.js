export const DEFAULT_CUBOS = [
  { id: "alquiler", emoji: "🏠", nombre: "Alquiler", presupuesto: 1020, tipo: "fijo", color: "#22C55E" },
  { id: "suministros", emoji: "⚡", nombre: "Suministros", presupuesto: 230, tipo: "fijo", color: "#EAB308" },
  { id: "prestamo", emoji: "💳", nombre: "Préstamo", presupuesto: 156, tipo: "fijo", color: "#EF4444" },
  { id: "super", emoji: "🛒", nombre: "Alimentación", presupuesto: 350, tipo: "semanal", color: "#22C55E" },
  { id: "caprichos", emoji: "🍽️", nombre: "Caprichos", presupuesto: 200, tipo: "diario", color: "#F97316" },
  { id: "vicios", emoji: "🚬", nombre: "Vicios", presupuesto: 50, tipo: "diario", color: "#DC2626" },
  { id: "digital", emoji: "📱", nombre: "Digital", presupuesto: 80, tipo: "fijo", color: "#A855F7" },
  { id: "bienestar", emoji: "💪", nombre: "Bienestar", presupuesto: 100, tipo: "fijo", color: "#06B6D4" },
  { id: "variable", emoji: "🔄", nombre: "Variable", presupuesto: 150, tipo: "diario", color: "#6B7280" },
]

export const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export const curMKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

export const mLabel = (k) => {
  if (!k) return ""
  const [y,m] = k.split("-")
  return `${MESES[parseInt(m)-1]} ${y}`
}

export const EMOJI_OPTIONS = ["🏠","⚡","💳","🛒","🍽️","🚬","📱","💪","🔄","🎮","🚗","✈️","🎬","📚","🐕","👶","🎵","💊","🏥","💡","🍺","☕","🏋️","📦","💰","🎁","🛍️","🔧"]

export const COLOR_OPTIONS = ["#22C55E","#EAB308","#EF4444","#F97316","#A855F7","#06B6D4","#6B7280","#EC4899","#14B8A6","#8B5CF6","#F43F5E","#0EA5E9"]

export const TIPO_OPTIONS = [
  { value: "fijo", label: "Fijo mensual" },
  { value: "semanal", label: "Semanal" },
  { value: "diario", label: "Diario" },
]
