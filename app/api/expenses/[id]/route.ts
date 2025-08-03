import { NextRequest, NextResponse } from "next/server";
import { ref, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";

interface Params {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const { userId, amount, category, description, currency, date } =
      await request.json();
    if (!userId || !id || !amount || !category || !currency || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await set(ref(database, `expenses/${userId}/${id}`), {
      amount,
      category,
      description: description || "", // Ensure description is a string
      currency,
      date,
    });
    return NextResponse.json(
      { id, amount, category, description, currency, date },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId || !id) {
    return NextResponse.json(
      { error: "User ID and Expense ID required" },
      { status: 401 }
    );
  }

  try {
    await remove(ref(database, `expenses/${userId}/${id}`));
    return NextResponse.json({ message: "Expense deleted" }, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense", details: error.message },
      { status: 500 }
    );
  }
}
