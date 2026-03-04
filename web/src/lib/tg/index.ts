import { prisma } from "@/lib/prisma"

export const GetTGIDs = async () => {
  const rows = await prisma.telegram.findMany({ select: { tg_id: true } })
  return rows.map((row) => row.tg_id)
}