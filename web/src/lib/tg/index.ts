import {prisma} from '@/lib/prisma'

export const GetTGIDs = async () => {
  const rows = await prisma.telegram.findMany({select: {tg_id: true}})
  return rows.map(row => row.tg_id)
}

export const GetUserIdByTGID = async (tgId: number) => {
  const row = await prisma.telegram.findFirst({where: {tg_id: tgId}})
  return row?.user_id
}
