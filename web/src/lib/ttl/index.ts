import { db } from "@/lib/db"

export const GetTTL = async (tgId: number) => {
  const ttl = await db`SELECT prices_ttl FROM telegram WHERE tg_id = ${tgId}`
  return ttl.length > 0 ? ttl[0].prices_ttl : 300
}