import { NextRequest, NextResponse } from "next/server";
import { ref, push, get, update, remove } from "firebase/database";
import { database } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  const { userId, amount, category, description, currency, date } =
    await request.json();
  if (!userId)
    return NextResponse.json({ error: "User ID required" }, { status: 401 });

  try {
    const expenseRef = ref(database, `expenses/${userId}`);
    const newExpense = await push(expenseRef, {
      amount: parseFloat(amount),
      category,
      description,
      currency,
      date,
    });
    return NextResponse.json(
      { id: newExpense.key, ...newExpense },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to add expense" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId)
    return NextResponse.json({ error: "User ID required" }, { status: 401 });

  try {
    const expenseRef = ref(database, `expenses/${userId}`);
    const snapshot = await get(expenseRef);
    const expenses = snapshot.val()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
      : [];
    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
