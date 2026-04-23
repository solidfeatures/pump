import { prisma } from '@/lib/prisma'

export interface ProgressPhoto {
  id: string
  date: string
  storage_path: string
  url: string
  angle: string
  notes?: string | null
  created_at?: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const BUCKET = 'progress-photos'

export function getPhotoPublicUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

function mapPhoto(raw: {
  id: string
  date: Date
  storage_path: string
  angle: string
  notes: string | null
  created_at: Date
}): ProgressPhoto {
  return {
    id: raw.id,
    date: raw.date.toISOString().split('T')[0],
    storage_path: raw.storage_path,
    url: getPhotoPublicUrl(raw.storage_path),
    angle: raw.angle,
    notes: raw.notes,
    created_at: raw.created_at.toISOString(),
  }
}

export async function getProgressPhotos(limit = 50): Promise<ProgressPhoto[]> {
  const rows = await prisma.progressPhoto.findMany({
    orderBy: { date: 'desc' },
    take: limit,
  })
  return rows.map(mapPhoto)
}

export async function createProgressPhoto(data: {
  date: string
  storage_path: string
  angle: string
  notes?: string
}): Promise<ProgressPhoto> {
  const row = await prisma.progressPhoto.create({
    data: {
      date: new Date(data.date),
      storage_path: data.storage_path,
      angle: data.angle,
      notes: data.notes ?? null,
    },
  })
  return mapPhoto(row)
}

export async function deleteProgressPhoto(id: string): Promise<string> {
  const row = await prisma.progressPhoto.delete({ where: { id } })
  return row.storage_path
}
