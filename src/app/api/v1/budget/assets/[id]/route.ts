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
  if (body.amount !== undefined) data.amount = body.amount
  if (body.currency !== undefined) data.currency = body.currency
  if (body.icon !== undefined) data.icon = body.icon

  await prisma.asset.updateMany({ where: { id, familyId: auth.user.familyId }, data })

  const asset = await prisma.asset.findFirst({ where: { id } })
  return NextResponse.json({ asset: asset ? { id: asset.id, name: asset.name, amount: Number(asset.amount), currency: asset.currency, icon: asset.icon } : null })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params
  await prisma.asset.deleteMany({ where: { id, familyId: auth.user.familyId } })
  return new NextResponse(null, { status: 204 })
}
