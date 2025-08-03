"use client";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  if (!user) return null;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">
        Welcome to Your Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/expenses"
          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-600 transition transform hover:-translate-y-1"
        >
          <h2 className="text-2xl font-semibold mb-2">Manage Expenses</h2>
          <p className="text-gray-100">
            Track and add your expenses with ease.
          </p>
        </Link>
        <Link
          href="/dashboard/analytics"
          className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-xl shadow-lg hover:from-green-600 hover:to-teal-600 transition transform hover:-translate-y-1"
        >
          <h2 className="text-2xl font-semibold mb-2">View Analytics</h2>
          <p className="text-gray-100">
            See insights and charts for your spending.
          </p>
        </Link>
      </div>
    </div>
  );
}
