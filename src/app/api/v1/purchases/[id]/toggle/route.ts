import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json()

  await prisma.purchase.updateMany({
    where: { id, familyId: auth.user.familyId },
    data: { isBought: body.isBought },
  })

  return NextResponse.json({ id, isBought: body.isBought })
}
