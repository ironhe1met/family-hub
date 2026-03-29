import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json()
  await prisma.purchaseList.updateMany({
    where: { id, familyId: auth.user.familyId },
    data: { name: body.name?.trim() },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  await prisma.purchaseList.deleteMany({ where: { id, familyId: auth.user.familyId } })
  return new NextResponse(null, { status: 204 })
}
