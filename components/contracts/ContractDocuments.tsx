'use client'
import { useRef, useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { formatDate, newId } from '@/lib/utils'
import { Upload, Trash2, Download, FileText } from 'lucide-react'

export function ContractDocuments({ contractId }: { contractId: string }) {
  const { documents, contracts, addDocument, deleteDocument, syncDocuments } = useStore()
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // uploads go through server API to keep token secret

  const contract = contracts.find(c => c.id === contractId)

  useEffect(() => {
    setSyncing(true)
    syncDocuments()
      .catch((err) => console.error('Failed to sync documents', err))
      .finally(() => setSyncing(false))
  }, [contractId, syncDocuments])

  const contractDocs = documents
    .filter((d) => d.contractId === contractId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (!contract) { setError('Контракт не найден'); return }

    setUploading(true)
    setError('')
    try {
      const contractNumber = contract.number || contractId
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('contractId', contractId)
        formData.append('contractNumber', contractNumber)
        const res = await fetch('/api/upload-doc', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Upload failed')
        await addDocument(data.document)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const downloadFile = (doc: typeof documents[0]) => {
    window.open(doc.fileUrl, '_blank')
  }

  const handleDeleteDocument = async (docId: string, docFileName: string) => {
    if (!confirm('Удалить документ?')) return
    if (!contract) {
      setError('Контракт не найден')
      return
    }
    try {
      const doc = documents.find(d => d.id === docId)
      const resp = await fetch('/api/delete-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, fileName: doc?.fileName, contractNumber: contract.number || contractId }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Delete failed')
      await deleteDocument(docId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    }
  }

  // folder creation handled server-side by upload API

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--card-shadow)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>📎 Документы ({contractDocs.length})</div>
        {syncing && <div style={{ fontSize: 12, color: 'var(--maf)', fontWeight: 600 }}>Синхронизация документов...</div>}
      </div>

      <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.dwg" style={{ display: 'none' }} />

      {contractDocs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8, marginBottom: 12 }}>
          {contractDocs.map((doc) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 11, transition: 'border-color .14s, background .14s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4dae2'; (e.currentTarget as HTMLElement).style.background = '#fafbfc' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.background = '#fff' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--maf-soft)', color: 'var(--maf)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <FileText size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.fileName}</div>
                <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{(doc.fileSize / 1024).toFixed(1)} KB · {formatDate(doc.uploadedAt)}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => downloadFile(doc)} title="Скачать"
                  style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--maf)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--faint)' }}>
                  <Download size={15} />
                </button>
                <button onClick={() => handleDeleteDocument(doc.id, doc.fileName)} title="Удалить"
                  style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--faint)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, marginBottom: 12 }}>{error}</div>}

      <button onClick={() => fileInputRef.current?.click()} disabled={uploading || syncing}
        style={{ width: '100%', padding: '14px', border: '1.5px dashed #d4dae2', borderRadius: 12, background: 'none', fontFamily: 'inherit', fontSize: 13, color: 'var(--faint)', cursor: uploading || syncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color .14s, background .14s, color .14s' }}
        onMouseEnter={e => { if (!uploading && !syncing) { (e.currentTarget as HTMLElement).style.borderColor = '#2f6bdc'; (e.currentTarget as HTMLElement).style.background = 'var(--maf-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--maf)' } }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4dae2'; (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--faint)' }}>
        <Upload size={15} />
        {uploading ? 'Загрузка...' : syncing ? 'Синхронизируется...' : 'Загрузить документы (можно несколько)'}
      </button>
    </div>
  )
}
