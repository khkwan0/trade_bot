import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exchange: string; baseCurrency: string; quoteCurrency: string }> }
) {
  const { exchange, baseCurrency, quoteCurrency } = await params;
  console.log(exchange, baseCurrency, quoteCurrency);
  return NextResponse.json({ status: 200 });
}