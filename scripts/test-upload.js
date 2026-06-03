import fs from 'fs'

const filePath = './test-upload.txt'
const url = 'http://localhost:3001/api/upload-doc'

async function run() {
  const buffer = fs.readFileSync(filePath)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-file-name': 'test-upload.txt',
      'x-file-type': 'text/plain',
      'x-contract-id': 'test-contract-id',
      'x-contract-number': 'TEST-001'
    },
    body: buffer,
  })
  const data = await res.text()
  console.log('status', res.status)
  console.log('body', data)
}

run().catch(err => { console.error(err); process.exit(1) })
