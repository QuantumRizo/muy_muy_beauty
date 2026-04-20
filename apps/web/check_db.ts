import { supabase } from './src/lib/supabase'

async function checkColumns() {
  const { data, error } = await supabase.from('sucursales').select('*').limit(1)
  if (error) {
    console.error(error)
  } else {
    console.log('Columns in sucursales:', Object.keys(data[0] || {}))
  }
}

checkColumns()
