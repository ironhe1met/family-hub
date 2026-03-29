import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.quantity !== undefined) data.quantity = body.quantity

  await prisma.purchase.updateMany({ where: { id, familyId: auth.user.familyId }, data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  await prisma.purchase.deleteMany({ where: { id, familyId: auth.user.familyId } })
  return new NextResponse(null, { status: 204 })
}
