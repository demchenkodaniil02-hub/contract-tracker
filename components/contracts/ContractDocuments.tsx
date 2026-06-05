'use client'
import { useRef, useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { Upload, Trash2, Download, FileText, X, Eye, ExternalLink } from 'lucide-react'
import { DOCUMENT_CATEGORIES, DocumentCategory } from '@/lib/types'

const CATEGORY_COLORS: Record<DocumentCategory, { bg: string; color: string }> = {
  contract: { bg: '#eff6ff', color: '#2f6bdc' },
  ks2:      { bg: '#f0fdf4', color: '#16a34a' },
  ks3:      { bg: '#f0fdf4', color: '#1f8a5b' },
  estimate: { bg: '#fff7ed', color: '#e07a1a' },
  act:      { bg: '#fdf4ff', color: '#9b5de5' },
  other:    { bg: '#f9fafb', color: '#6b7280' },
}

function canPreview(fileType: string, fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf' || ext === 'pdf'
  const isOffice = ['doc','docx','xls','xlsx','ppt','pptx'].includes(ext)
  return { isImage, isPdf, isOffice, can: isImage || isPdf || isOffice }
}

function getPreviewUrl(fileUrl: string, fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const isOffice = ['doc','docx','xls','xlsx','ppt','pptx'].includes(ext)
  if (isOffice) return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  return fileUrl
}

export function ContractDocuments({ contractId }: { contractId: string }) {
  const { documents, contracts, addDocument, deleteDocument, syncDocuments } = useStore()
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState<DocumentCategory>('other')
  const [filterCat, setFilterCat] = useState<DocumentCategory | 'all'>('all')
  const [preview, setPreview] = useState<{ url: string; name: string; type: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const contract = contracts.find(c => c.id === contractId)

  useEffect(() => {
    setSyncing(true)
    syncDocuments().catch(console.error).finally(() => setSyncing(false))
  }, [contractId])

  const contractDocs = documents
    .filter(d => d.contractId === contractId)
    .filter(d => filterCat === 'all' || d.category === filterCat)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))

  const allDocs = documents.filter(d => d.contractId === contractId)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !contract) return
    setUploading(true); setError('')
    try {
      const contractNumber = contract.number || contractId
      for (const file of files) {
        const urlRes = await fetch('/api/get-upload-url', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contractNumber, contractId }),
        })
        const urlData = await urlRes.json()
        if (!urlRes.ok) throw new Error(urlData?.error || 'Не удалось получить ссылку')

        const uploadRes = await fetch(urlData.uploadUrl, {
          method: 'PUT', body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        })
        if (!uploadRes.ok) throw new Error(`Ошибка загрузки: ${uploadRes.status}`)

        const finalRes = await fetch('/api/finalize-upload', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: urlData.path, contractId, fileName: file.name, fileSize: file.size, fileType: file.type || 'application/octet-stream', category }),
        })
        const finalData = await finalRes.json()
        if (!finalRes.ok) throw new Error(finalData?.error || 'Ошибка сохранения')
        await addDocument(finalData.document)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const [catOverrides, setCatOverrides] = useState<Record<string, DocumentCategory>>({})

  const handleCategoryChange = async (docId: string, newCategory: DocumentCategory) => {
    setCatOverrides(prev => ({ ...prev, [docId]: newCategory }))
    try {
      await fetch('/api/mutate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'documents', action: 'update', data: { category: newCategory }, id: docId }),
      })
    } catch (err) {
      setCatOverrides(prev => { const n = { ...prev }; delete n[docId]; return n })
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDelete = async (docId: string, fileName: string) => {
    if (!confirm('Удалить документ?') || !contract) return
    try {
      const doc = documents.find(d => d.id === docId)
      const resp = await fetch('/api/delete-doc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, fileName: doc?.fileName, contractNumber: contract.number || contractId }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Delete failed')
      await deleteDocument(docId)
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>

      {/* Шапка */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>📎 Документы ({allDocs.length})</div>
        {syncing && <span style={{ fontSize: 12, color: 'var(--maf)' }}>Синхронизация...</span>}
      </div>

      {/* Фильтр по категориям */}
      {allDocs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <button onClick={() => setFilterCat('all')}
            style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--line)', background: filterCat === 'all' ? '#2f6bdc' : '#fff', color: filterCat === 'all' ? '#fff' : 'var(--muted-ink)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600 }}>
            Все {allDocs.length}
          </button>
          {DOCUMENT_CATEGORIES.filter(c => allDocs.some(d => (d.category || 'other') === c.value)).map(c => {
            const count = allDocs.filter(d => (d.category || 'other') === c.value).length
            const col = CATEGORY_COLORS[c.value]
            return (
              <button key={c.value} onClick={() => setFilterCat(c.value)}
                style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${filterCat === c.value ? col.color : 'var(--line)'}`, background: filterCat === c.value ? col.color : col.bg, color: filterCat === c.value ? '#fff' : col.color, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600 }}>
                {c.label} {count}
              </button>
            )
          })}
        </div>
      )}

      {/* Список документов */}
      {contractDocs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, maxHeight: 300, overflowY: 'auto' }}>
          {contractDocs.map(doc => {
            const cat = (catOverrides[doc.id] ?? doc.category ?? 'other') as DocumentCategory
            const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other
            const { can } = canPreview(doc.fileType, doc.fileName)
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, transition: 'background .12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafbfc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: col.bg, color: col.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <FileText size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.fileName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    {/* Категория — кликабельный select */}
                    <select value={cat} onChange={e => handleCategoryChange(doc.id, e.target.value as DocumentCategory)}
                      onClick={e => e.stopPropagation()}
                      style={{ background: col.bg, color: col.color, border: `1px solid ${col.color}30`, padding: '1px 5px', borderRadius: 4, fontWeight: 600, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                      {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <span>{(doc.fileSize / 1024).toFixed(1)} KB · {formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  {can && (
                    <button onClick={() => setPreview({ url: getPreviewUrl(doc.fileUrl, doc.fileName), name: doc.fileName, type: doc.fileType })} title="Просмотр"
                      style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#2f6bdc'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--faint)'}>
                      <Eye size={15} />
                    </button>
                  )}
                  <button onClick={() => window.open(doc.fileUrl, '_blank')} title="Скачать"
                    style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--maf)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--faint)'}>
                    <Download size={15} />
                  </button>
                  <button onClick={() => handleDelete(doc.id, doc.fileName)} title="Удалить"
                    style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--faint)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {/* Загрузка с выбором категории */}
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={category} onChange={e => setCategory(e.target.value as DocumentCategory)}
          style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 9, fontFamily: 'inherit', fontSize: 13, background: '#fff', color: 'var(--ink)', flexShrink: 0 }}>
          {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading || syncing}
          style={{ flex: 1, padding: '9px 14px', border: '1.5px dashed #d4dae2', borderRadius: 10, background: 'none', fontFamily: 'inherit', fontSize: 13, color: 'var(--faint)', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          onMouseEnter={e => { if (!uploading) { (e.currentTarget as HTMLElement).style.borderColor = '#2f6bdc'; (e.currentTarget as HTMLElement).style.color = 'var(--maf)' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4dae2'; (e.currentTarget as HTMLElement).style.color = 'var(--faint)' }}>
          <Upload size={14} />
          {uploading ? 'Загрузка...' : 'Загрузить (можно несколько)'}
        </button>
      </div>

      <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.dwg" style={{ display: 'none' }} />

      {/* Модал просмотра */}
      {preview && (
        <div onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '90vw', maxWidth: 960, height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Шапка */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.name}</span>
              <a href={preview.url} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--maf)', textDecoration: 'none', fontWeight: 600, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--line)' }}>
                <ExternalLink size={13} /> Открыть
              </a>
              <button onClick={() => setPreview(null)}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                <X size={16} />
              </button>
            </div>
            {/* Контент */}
            <div style={{ flex: 1, overflow: 'hidden', background: '#f0f0f0' }}>
              {preview.type.startsWith('image/') ? (
                <img src={preview.url} alt={preview.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <iframe src={preview.url} style={{ width: '100%', height: '100%', border: 'none' }} title={preview.name} sandbox="allow-scripts allow-same-origin allow-popups" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
