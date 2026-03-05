// Importa a função de criação do client Supabase via CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Cria o client com a URL e a chave fornecidas
export const supabase = createClient(
  'https://fdcrqqfrshcqckypgips.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkY3JxcWZyc2hjcWNreXBnaXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzU3MzksImV4cCI6MjA4ODExMTczOX0.rUqR8XEJHDg8xlhOg7G28c71mv8g1Cpo3Gri4XzQPSk'
)
    