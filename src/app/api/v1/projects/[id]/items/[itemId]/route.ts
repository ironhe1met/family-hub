import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id, itemId } = await params

  const existing = await prisma.projectItem.findFirst({ where: { id: itemId, projectId: id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Елемент не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.status !== undefined) data.status = body.status
  if (body.estimatedCost !== undefined) data.estimatedCost = body.estimatedCost
  if (body.currency !== undefined) data.currency = body.currency
  if (body.url !== undefined) data.url = body.url

  const item = await prisma.projectItem.update({ where: { id: itemId }, data })
  return NextResponse.json({ item })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id, itemId } = await params

  const existing = await prisma.projectItem.findFirst({ where: { id: itemId, projectId: id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Елемент не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.projectItem.delete({ where: { id: itemId } })
  return new NextResponse(null, { status: 204 })
}
