"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format, parseISO, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getExchangeRates } from "@/lib/currency";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  currency: string;
  date: string;
}

interface ExchangeRates {
  [key: string]: number;
}

interface Cache {
  data: ExchangeRates;
  timestamp: number;
}

export default function AnalyticsCharts() {
  const [user] = useAuthState(auth);
  const [timePeriod, setTimePeriod] = useState<
    "Daily" | "Weekly" | "Monthly" | "Yearly" | "Custom"
  >("Monthly");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState<ExchangeRates>({});
  const [cache, setCache] = useState<Cache | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const currencies = ["USD", "EUR", "GBP", "AED", "INR"];
  const categories = [
    "All",
    "Food",
    "Transport",
    "Entertainment",
    "Housing",
    "Utilities",
    "Healthcare",
    "Education",
    "Shopping",
    "Travel",
    "Other",
  ];

  // Fetch expenses using react-query
  const {
    data: expenses = [],
    isLoading,
    error,
  } = useQuery<Expense[], Error>({
    queryKey: ["expenses", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const response = await axios.get(`/api/expenses?userId=${user.uid}`);
      return response.data as Expense[];
    },
    enabled: !!user,
  });

  // Cache exchange rates
  useEffect(() => {
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    if (!cache || (cache && Date.now() - cache.timestamp > CACHE_DURATION)) {
      getExchangeRates("USD")
        .then((data) => {
          const newCache: Cache = { data, timestamp: Date.now() };
          setCache(newCache);
          setRates(data);
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: any) => {
          console.error("Error fetching exchange rates:", err);
          toast.error("Failed to fetch exchange rates");
        });
    } else {
      setRates(cache.data);
    }
  }, [cache]);

  const convertAmount = (amount: number, fromCurrency: string) => {
    if (!rates[currency] || !rates[fromCurrency]) return amount;
    return (amount * rates[currency]) / rates[fromCurrency];
  };

  // Filter expenses by category and date range
  const filteredExpenses = expenses.filter((expense) => {
    const matchesCategory =
      selectedCategory === "All" || expense.category === selectedCategory;
    if (timePeriod !== "Custom" || !startDate || !endDate)
      return matchesCategory;
    const expenseDate = parseISO(expense.date);
    return (
      matchesCategory && expenseDate >= startDate && expenseDate <= endDate
    );
  });

  // Calculate total expenses for annotation
  const totalExpenses = filteredExpenses
    .reduce(
      (sum, expense) => sum + convertAmount(expense.amount, expense.currency),
      0
    )
    .toFixed(2);

  // Category Breakdown
  const categoryData = filteredExpenses.reduce((acc, expense) => {
    const amount = convertAmount(expense.amount, expense.currency);
    acc[expense.category] = (acc[expense.category] || 0) + amount;
    return acc;
  }, {} as { [key: string]: number });

  const pieData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#ef4444",
          "#f59e0b",
          "#8b5cf6",
          "#ec4899",
          "#6b7280",
          "#14b8a6",
          "#f97316",
          "#eab308",
        ],
      },
    ],
  };

  const barData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: `Expenses by Category (${currency})`,
        data: Object.values(categoryData),
        backgroundColor: "#3b82f6",
        hoverBackgroundColor: "#2563eb",
      },
    ],
  };

  // Expenses Over Time
  const timeData = filteredExpenses.reduce((acc, expense) => {
    const date = parseISO(expense.date);
    let key: string;
    if (timePeriod === "Daily") {
      key = format(date, "MMM dd, yyyy");
    } else if (timePeriod === "Weekly") {
      key = `Week of ${format(
        startOfWeek(date, { weekStartsOn: 1 }),
        "MMM dd, yyyy"
      )}`;
    } else if (timePeriod === "Yearly") {
      key = format(date, "yyyy");
    } else if (timePeriod === "Custom" && startDate && endDate) {
      key = format(date, "MMM yyyy");
    } else {
      key = format(date, "MMM yyyy"); // Default to Monthly
    }
    acc[key] =
      (acc[key] || 0) + convertAmount(expense.amount, expense.currency);
    return acc;
  }, {} as { [key: string]: number });

  const lineData = {
    labels: Object.keys(timeData).sort(
      (a, b) =>
        new Date(a.includes("Week") ? a.replace("Week of ", "") : a).getTime() -
        new Date(b.includes("Week") ? b.replace("Week of ", "") : b).getTime()
    ),
    datasets: [
      {
        label: `Expenses Over Time (${currency})`,
        data: Object.values(timeData),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Reset custom date range
  const resetDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setTimePeriod("Monthly");
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl border border-gray-100 max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Analytics Dashboard
      </h2>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-600"
        >
          Loading charts...
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-red-500 mb-4"
        >
          Failed to load expenses: {error.message}
          <button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["expenses", user?.uid],
              })
            }
            className="ml-2 text-blue-500 hover:underline"
          >
            Retry
          </button>
        </motion.div>
      )}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Filters */}
          <div className="flex flex-col gap-4 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Period
                  </label>
                  <select
                    value={timePeriod}
                    onChange={(e) =>
                      setTimePeriod(
                        e.target.value as
                          | "Daily"
                          | "Weekly"
                          | "Monthly"
                          | "Yearly"
                          | "Custom"
                      )
                    }
                    className="p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 w-full sm:w-40 hover:bg-gray-200 transition-colors"
                    title="Select how expenses are grouped over time"
                  >
                    <option value="Daily" title="Group expenses by day">
                      Daily
                    </option>
                    <option
                      value="Weekly"
                      title="Group expenses by week (Monday start)"
                    >
                      Weekly
                    </option>
                    <option value="Monthly" title="Group expenses by month">
                      Monthly
                    </option>
                    <option value="Yearly" title="Group expenses by year">
                      Yearly
                    </option>
                    <option value="Custom" title="Select a custom date range">
                      Custom Range
                    </option>
                  </select>
                </div>
                {timePeriod === "Custom" && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date: Date | null) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        maxDate={endDate || new Date()}
                        dateFormat="MMM yyyy"
                        showMonthYearPicker
                        className="p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 w-full sm:w-40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date: Date | null) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate ?? undefined}
                        maxDate={new Date()}
                        dateFormat="MMM yyyy"
                        showMonthYearPicker
                        className="p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 w-full sm:w-40"
                      />
                    </div>
                    <div className="self-end">
                      <button
                        onClick={resetDateRange}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 w-full sm:w-40 hover:bg-gray-200 transition-colors"
                    title="Filter expenses by category"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 w-full sm:w-40 hover:bg-gray-200 transition-colors"
                    title="Display expenses in selected currency"
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total Expenses: {totalExpenses} {currency}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md max-h-[400px] sm:max-h-[450px] overflow-hidden"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Category Breakdown
              </h3>
              <div className="relative h-[250px] sm:h-[300px]">
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 15,
                          font: { size: 12 },
                        },
                      },
                      tooltip: {
                        backgroundColor: "#1f2937",
                        titleFont: { size: 14 },
                        bodyFont: { size: 12 },
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md max-h-[400px] sm:max-h-[450px] overflow-hidden"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Expenses by Category
              </h3>
              <div className="relative h-[250px] sm:h-[300px]">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "#1f2937",
                        titleFont: { size: 14 },
                        bodyFont: { size: 12 },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: currency,
                          font: { size: 12 },
                        },
                      },
                      x: {
                        ticks: {
                          font: { size: 10 },
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md lg:col-span-2 max-h-[400px] sm:max-h-[450px] overflow-hidden"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Expenses Over Time
              </h3>
              <div className="relative h-[250px] sm:h-[300px]">
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "#1f2937",
                        titleFont: { size: 14 },
                        bodyFont: { size: 12 },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: currency,
                          font: { size: 12 },
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: timePeriod,
                          font: { size: 12 },
                        },
                        ticks: {
                          font: { size: 10 },
                          maxRotation: timePeriod === "Daily" ? 45 : 0,
                        },
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
