import {auth} from '@/auth'
import MarketPriceFeed from '@/components/market-price-feed'
import Balances from '@/components/balances'

export default async function DashboardPage() {
  const session = await auth()
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Dashboard
      </h1>
      <Balances userId={session?.user?.id} />
      <MarketPriceFeed />
    </div>
  )
}
