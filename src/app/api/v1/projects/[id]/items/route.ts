import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const project = await prisma.project.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!project) {
    return NextResponse.json({ error: 'Проєкт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Назва обов\'язкова', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const count = await prisma.projectItem.count({ where: { projectId: id } })

  const item = await prisma.projectItem.create({
    data: {
      projectId: id,
      familyId: auth.user.familyId,
      title: body.title.trim(),
      estimatedCost: body.estimatedCost || null,
      currency: body.currency || 'UAH',
      url: body.url || null,
      sortOrder: count,
    },
  })

  return NextResponse.json({ item }, { status: 201 })
}
