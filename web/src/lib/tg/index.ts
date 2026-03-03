import { db } from "@/lib/db"

export const GetTGIDs = async () => {
  const tgIds = await db`SELECT tg_id FROM telegram`
  return tgIds.map((tgId: { tg_id: number }) => tgId.tg_id)
}