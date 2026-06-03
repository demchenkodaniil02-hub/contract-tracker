const YANDEX_DISK_API = 'https://cloud-api.yandex.net/v1/disk'
const YANDEX_DISK_UPLOAD_API = 'https://uploader.disk.yandex.ru'

interface UploadLinkResponse {
  href: string
  method: string
  templated: boolean
}

interface ResourceResponse {
  href: string
  name: string
  path: string
  public_url?: string
}

interface FileLinkResponse {
  public_url: string
  href: string
  method: string
}

export class YandexDiskClient {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private getAuthHeader() {
    return {
      Authorization: `OAuth ${this.token}`,
      'Content-Type': 'application/json',
    }
  }

  async uploadFile(file: File, path: string): Promise<string> {
    try {
      // Путь уже передан как полный: /objects/{objectId}/contracts/{contractId}/{filename}
      const encodedPath = encodeURIComponent(path)

      const uploadLinkRes = await fetch(
        `${YANDEX_DISK_API}/resources/upload?path=${encodedPath}&overwrite=false`,
        {
          method: 'GET',
          headers: this.getAuthHeader(),
        }
      )

      if (!uploadLinkRes.ok) {
        throw new Error(`Ошибка получения ссылки загрузки: ${uploadLinkRes.statusText}`)
      }

      const uploadLinkData = (await uploadLinkRes.json()) as UploadLinkResponse
      const uploadUrl = uploadLinkData.href

      // Загрузить файл
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      })

      if (!uploadRes.ok) {
        throw new Error(`Ошибка загрузки файла: ${uploadRes.statusText}`)
      }

      // Получить публичную ссылку
      const publicUrl = await this.getPublicUrl(path)
      return publicUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Ошибка Яндекс.Диска: ${message}`)
    }
  }

  // Upload from server-side buffer
  async uploadBuffer(buffer: Buffer | Uint8Array, path: string, contentType?: string): Promise<string> {
    try {
      const encodedPath = encodeURIComponent(path)

      const uploadLinkRes = await fetch(
        `${YANDEX_DISK_API}/resources/upload?path=${encodedPath}&overwrite=false`,
        {
          method: 'GET',
          headers: this.getAuthHeader(),
        }
      )

      if (!uploadLinkRes.ok) throw new Error(`Ошибка получения ссылки загрузки: ${uploadLinkRes.statusText}`)

      const uploadLinkData = await uploadLinkRes.json() as UploadLinkResponse
      const uploadUrl = uploadLinkData.href

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: buffer as any,
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
        },
      })

      if (!uploadRes.ok) throw new Error(`Ошибка загрузки файла: ${uploadRes.statusText}`)

      const publicUrl = await this.getPublicUrl(path)
      return publicUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Ошибка загрузки буфера на Яндекс.Диск: ${message}`)
    }
  }

  private async getPublicUrl(path: string): Promise<string> {
    try {
      const encodedPath = encodeURIComponent(path)

      // Опубликовать файл
      const publishRes = await fetch(
        `${YANDEX_DISK_API}/resources/publish?path=${encodedPath}`,
        {
          method: 'PUT',
          headers: this.getAuthHeader(),
        }
      )

      if (!publishRes.ok) {
        throw new Error(`Ошибка публикации: ${publishRes.statusText}`)
      }

      // Получить публичную ссылку
      const resourceRes = await fetch(
        `${YANDEX_DISK_API}/resources?path=${encodedPath}`,
        {
          method: 'GET',
          headers: this.getAuthHeader(),
        }
      )

      if (!resourceRes.ok) {
        throw new Error(`Ошибка получения информации: ${resourceRes.statusText}`)
      }

      const resourceData = (await resourceRes.json()) as ResourceResponse
      return resourceData.public_url || `https://disk.yandex.ru/d/${path.split('/').pop()}`
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Ошибка получения публичной ссылки: ${message}`)
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const encodedPath = encodeURIComponent(path)
      const res = await fetch(`${YANDEX_DISK_API}/resources?path=${encodedPath}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(),
      })

      if (!res.ok && res.status !== 204) {
        throw new Error(`Ошибка удаления: ${res.statusText}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Ошибка удаления файла: ${message}`)
    }
  }

  async ensureFolder(path: string): Promise<void> {
    try {
      const encodedPath = encodeURIComponent(path)
      // Проверим, есть ли ресурс
      const res = await fetch(`${YANDEX_DISK_API}/resources?path=${encodedPath}`, {
        method: 'GET',
        headers: this.getAuthHeader(),
      })

      if (res.ok) {
        return
      }

      // Если не найден — создаём папку
      const createRes = await fetch(`${YANDEX_DISK_API}/resources?path=${encodedPath}`, {
        method: 'PUT',
        headers: this.getAuthHeader(),
      })

      if (!createRes.ok) {
        throw new Error(`Ошибка создания папки: ${createRes.statusText}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      // Не прерываем UI на незначительных ошибках, но логируем
      throw new Error(`Ошибка ensureFolder Яндекс.Диска: ${message}`)
    }
  }

  async listFolder(path: string): Promise<string[] | null> {
    try {
      const encodedPath = encodeURIComponent(path)
      const res = await fetch(`${YANDEX_DISK_API}/resources?path=${encodedPath}`, {
        method: 'GET',
        headers: this.getAuthHeader(),
      })

      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error(`Ошибка получения списка папки: ${res.statusText}`)
      }

      const data = await res.json()
      return data._embedded?.items?.map((item: { name: string }) => item.name) ?? []
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Ошибка listFolder Яндекс.Диска: ${message}`)
    }
  }
}

export function createYandexDiskClient(): YandexDiskClient | null {
  // Use only server-side token to avoid leaking credentials to the client bundle
  const token = process.env.YANDEX_DISK_TOKEN
  if (!token) return null
  return new YandexDiskClient(token)
}
