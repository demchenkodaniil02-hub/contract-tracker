(async ()=>{
  const fs = require('fs')
  const path = require('path')
  const https = require('https')

  // Load .env.local
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) { console.error('.env.local not found'); process.exit(1) }
  const env = fs.readFileSync(envPath,'utf8').split(/\r?\n/).filter(Boolean).reduce((acc, line)=>{
    const idx = line.indexOf('=')
    if (idx>0){ acc[line.slice(0,idx)]=line.slice(idx+1) }
    return acc
  }, {})

  const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL
  const SUPA_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const YANDEX_TOKEN = env.YANDEX_DISK_TOKEN

  if (!SUPA_URL || !SUPA_KEY) { console.error('Supabase config missing in .env.local'); process.exit(1) }
  if (!YANDEX_TOKEN) { console.error('YANDEX_DISK_TOKEN missing in .env.local'); process.exit(1) }

  const fetch = global.fetch || ((url, opts = {}) => new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? require('https') : require('http')
    const req = lib.request(u, { method: opts.method || 'GET', headers: opts.headers || {} }, res => {
      let data = ''
      res.on('data', ch => data += ch)
      res.on('end', () => {
        res.body = data
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: async () => res.body, json: async () => JSON.parse(res.body) })
      })
    })
    req.on('error', reject)
    if (opts.body) req.write(opts.body)
    req.end()
  }))

  // 1) fetch all documents
  console.log('Fetching documents...')
  const docsRes = await fetch(`${SUPA_URL}/rest/v1/documents?select=*`, { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } })
  if (!docsRes.ok) { console.error('Failed to fetch documents', await docsRes.text()); process.exit(1) }
  const docs = await docsRes.json()
  const need = docs.filter(d=>typeof d.fileUrl === 'string' && d.fileUrl.startsWith('data:'))
  console.log(`Found ${need.length} documents with data: URLs`)
  if (need.length===0) process.exit(0)

  for (const d of need) {
    try {
      console.log('Migrating', d.id, d.fileName)
      // decode data URL
      const m = d.fileUrl.match(/^data:([^;]+);base64,(.*)$/)
      if (!m) { console.warn('Skipping, not base64 data URL'); continue }
      const mime = m[1]
      const b64 = m[2]
      const buffer = Buffer.from(b64, 'base64')

      // get contract to find objectId
      const cRes = await fetch(`${SUPA_URL}/rest/v1/contracts?id=eq.${d.contractId}&select=*`, { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } })
      const cJson = await cRes.json()
      const contract = cJson[0]
      const objectId = contract?.objectId || 'unknown'

      const fileName = `${Date.now()}_${d.fileName}`
      const remotePath = `/objects/${objectId}/contracts/${d.contractId}/${fileName}`
      const encPath = encodeURIComponent(remotePath)

      // ensure parent directories exist
      const parent = remotePath.split('/').slice(0, -1).join('/') || '/'
      const parts = parent.split('/').filter(Boolean)
      let cur = ''
      for (const p of parts) {
        cur += '/' + p
        const enc = encodeURIComponent(cur)
        await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${enc}`, { method: 'PUT', headers: { Authorization: `OAuth ${YANDEX_TOKEN}` } }).catch(()=>{})
      }

      // get upload link
      const uploadLinkRes = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encPath}&overwrite=false`, { headers: { Authorization: `OAuth ${YANDEX_TOKEN}` } })
      if (!uploadLinkRes.ok) { console.error('Failed to get upload link', await uploadLinkRes.text()); continue }
      const uploadInfo = await uploadLinkRes.json()
      const uploadHref = uploadInfo.href

      // upload file with PUT
      const uploadPut = await fetch(uploadHref, { method: 'PUT', headers: { 'Content-Type': mime }, body: buffer })
      if (!uploadPut.ok) { console.error('Upload failed', await uploadPut.text()); continue }

      // publish
      const pubRes = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encPath}`, { method: 'PUT', headers: { Authorization: `OAuth ${YANDEX_TOKEN}` } })
      // ignore errors if already published

      // get resource info
      const resRes = await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encPath}`, { headers: { Authorization: `OAuth ${YANDEX_TOKEN}` } })
      const resJson = await resRes.json()
      const publicUrl = resJson.public_url || `https://disk.yandex.ru/d/${encodeURIComponent(fileName)}`

      // update supabase row
      const body = JSON.stringify({ fileUrl: publicUrl })
      const patchRes = await fetch(`${SUPA_URL}/rest/v1/documents?id=eq.${d.id}`, { method: 'PATCH', headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body })
      if (!patchRes.ok) { console.error('Failed to update record', await patchRes.text()); continue }
      console.log('Migrated', d.id, '->', publicUrl)
    } catch (err) {
      console.error('Error migrating', d.id, err.message)
    }
  }

  console.log('Done')
  process.exit(0)
})()
