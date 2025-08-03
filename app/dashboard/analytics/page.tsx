"use client";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Analytics() {
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

  return <AnalyticsCharts />;
}
