import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.amount !== undefined) data.amount = body.amount
  if (body.description !== undefined) data.description = body.description
  if (body.categoryId !== undefined) data.categoryId = body.categoryId
  if (body.date !== undefined) data.date = new Date(body.date)

  await prisma.budgetTransaction.updateMany({ where: { id, familyId: auth.user.familyId }, data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  await prisma.budgetTransaction.deleteMany({ where: { id, familyId: auth.user.familyId } })
  return new NextResponse(null, { status: 204 })
}
