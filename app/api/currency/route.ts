import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseCurrency = searchParams.get("base") || "USD";
  try {
    const response = await axios.get(
      `https://api.exchangerate.host/latest?base=${baseCurrency}`
    );
    return NextResponse.json(response.data.rates, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
