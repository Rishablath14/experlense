"use client";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-2xl max-w-md text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Expense Tracker
        </h1>
        <p className="text-gray-600 mb-6">
          Track your expenses with ease and gain insights into your spending
          habits.
        </p>
        <div className="space-x-4">
          <a
            href="/login"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-md hover:from-blue-600 hover:to-indigo-600 transition"
          >
            Login
          </a>
          <a
            href="/signup"
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-md hover:from-green-600 hover:to-teal-600 transition"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
