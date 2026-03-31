import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.amount !== undefined) data.amount = body.amount
  if (body.categoryId !== undefined) data.categoryId = body.categoryId
  if (body.targetDate !== undefined) data.targetDate = body.targetDate ? new Date(body.targetDate) : null

  await prisma.budgetPlanned.updateMany({ where: { id, familyId: auth.user.familyId }, data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params
  await prisma.budgetPlanned.deleteMany({ where: { id, familyId: auth.user.familyId } })
  return new NextResponse(null, { status: 204 })
}
