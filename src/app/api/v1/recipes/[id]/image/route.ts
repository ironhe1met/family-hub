import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const existing = await prisma.recipe.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Рецепт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('image') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Файл обов\'язковий', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Максимум 5MB', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    return NextResponse.json({ error: 'Дозволені формати: jpg, png, webp', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const filename = `${id}_${Date.now()}.${ext}`
  const dir = join(process.cwd(), 'public', 'uploads', 'recipes')
  await mkdir(dir, { recursive: true })
  const bytes = new Uint8Array(await file.arrayBuffer())
  await writeFile(join(dir, filename), bytes)

  const imageUrl = `/uploads/recipes/${filename}`
  await prisma.recipe.update({ where: { id }, data: { imageUrl } })

  return NextResponse.json({ imageUrl })
}
