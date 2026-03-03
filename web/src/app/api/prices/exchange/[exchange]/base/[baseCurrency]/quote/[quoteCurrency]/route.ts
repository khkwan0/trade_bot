import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { exchange, baseCurrency, quoteCurrency } = request.nextUrl.pathname.split("/");
  console.log(exchange, baseCurrency, quoteCurrency);
  return NextResponse.json({status: 200})
}