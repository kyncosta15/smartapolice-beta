import { useState } from 'react'
import { Download, Eye, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LocationFilter } from './LocationFilter'
import { PolicyEditModal } from './PolicyEditModal'
import { useIsMobile } from '@/hooks/use-mobile'
import { renderValue, renderValueAsString } from '@/utils/renderValue'
import { toText } from '@/lib/policies'

interface Policy {
  id: string
  name: any
  insurer: any
  policyNumber: any
  type: any
  uf: string
  pdfPath: string
}

interface Props {
  policies: Policy[]
  onPolicySelect: (p: Policy) => void
  onPolicyEdit: (p: Policy) => void
  onPolicyDelete: (id: string) => void
}

export function PolicyViewer({ policies, onPolicySelect, onPolicyEdit, onPolicyDelete }: Props) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [locationFilters, setLocationFilters] = useState<{ states: string[]; cities: string[] }>({ states: [], cities: [] })
  const [editing, setEditing] = useState<Policy | null>(null)
  const [isEditOpen, setEditOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleDownload = async (policy: Policy) => {
    try {
      // chama a nossa rota de proxy que define attachment
      const res = await fetch(`/api/download?pdfPath=${encodeURIComponent(policy.pdfPath)}`)
      if (!res.ok) throw res

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${toText(policy.name)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao baixar PDF:', err)
      alert('Não foi possível baixar o arquivo. Tente novamente.')
    }
  }

  const getSearchableText = (policy: Policy) => {
    const name = toText(policy.name);
    const insurer = toText(policy.insurer);
    const policyNumber = toText(policy.policyNumber);
    
    return `${name} ${insurer} ${policyNumber}`.toLowerCase();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className={`${isMobile ? 'pb-4' : 'pb-6'}`}>
          {/* Seu campo de busca e botões aqui, atualizando `search` e `showFilters` */}
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0">
            <LocationFilter onFilterChange={setLocationFilters} />
          </CardContent>
        )}
      </Card>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
        {policies
          .filter(policy => getSearchableText(policy).includes(search.toLowerCase()))
          .map(policy => (
            <Card key={policy.id}>
              <CardContent>
                <h3 className="text-lg font-semibold">{toText(policy.name)}</h3>
                <p className="text-sm">{toText(policy.insurer)}</p>
                <p className="text-xs text-gray-500">Apólice: {toText(policy.policyNumber)}</p>

                <div className="flex space-x-2 mt-4">
                  <Button size="sm" onClick={() => handleDownload(policy)}>
                    <Download size={16} /> Baixar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onPolicySelect(policy)}>
                    <Eye size={16} /> Ver
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(policy); setEditOpen(true) }}>
                    <Edit size={16} /> Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onPolicyDelete(policy.id)}>
                    <Trash2 size={16} /> Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {editing && (
        <PolicyEditModal
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          policy={editing}
          onSave={onPolicyEdit}
        />
      )}
    </div>
  )
}