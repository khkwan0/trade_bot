import MarketPriceFeed from '@/components/market-price-feed'

export default function DashboardPage() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Dashboard
      </h1>
      <MarketPriceFeed />
    </div>
  )
}
