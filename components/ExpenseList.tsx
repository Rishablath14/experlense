"use client";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import CustomDatePicker from "./DatePicker";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  currency: string;
  date: string;
}

export default function ExpenseList() {
  const [user] = useAuthState(auth);
  const [currency, setCurrency] = useState("USD");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterCategory, setFilterCategory] = useState("All");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Food");
  const [editDescription, setEditDescription] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editError, setEditError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  const currencies = ["USD", "EUR", "GBP", "AED", "INR"];
  const categories = [
    { value: "All", label: "All", icon: "" },
    { value: "Food", label: "Food", icon: "🍽️" },
    { value: "Transport", label: "Transport", icon: "🚗" },
    { value: "Entertainment", label: "Entertainment", icon: "🎥" },
    { value: "Housing", label: "Housing", icon: "🏠" },
    { value: "Utilities", label: "Utilities", icon: "💡" },
    { value: "Healthcare", label: "Healthcare", icon: "🏥" },
    { value: "Education", label: "Education", icon: "📚" },
    { value: "Shopping", label: "Shopping", icon: "🛍️" },
    { value: "Travel", label: "Travel", icon: "✈️" },
    { value: "Other", label: "Other", icon: "📌" },
  ];

  const categoryStyles: { [key: string]: { bg: string; icon: string } } = {
    Food: { bg: "bg-blue-100", icon: "🍽️" },
    Transport: { bg: "bg-green-100", icon: "🚗" },
    Entertainment: { bg: "bg-purple-100", icon: "🎥" },
    Housing: { bg: "bg-yellow-100", icon: "🏠" },
    Utilities: { bg: "bg-orange-100", icon: "💡" },
    Healthcare: { bg: "bg-red-100", icon: "🏥" },
    Education: { bg: "bg-indigo-100", icon: "📚" },
    Shopping: { bg: "bg-pink-100", icon: "🛍️" },
    Travel: { bg: "bg-teal-100", icon: "✈️" },
    Other: { bg: "bg-gray-100", icon: "📌" },
  };

  // Fetch expenses using react-query
  const {
    data: expenses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["expenses", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const response = await axios.get(`/api/expenses?userId=${user.uid}`);
      return response.data as Expense[];
    },
    enabled: !!user,
  });

  // Cache exchange rates
  const { data: exchangeRates } = useQuery({
    queryKey: ["exchangeRates"],
    queryFn: () =>
      axios
        .get("https://api.exchangerate-api.com/v4/latest/USD")
        .then((res) => res.data.rates),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    onError: () => toast.error("Failed to fetch exchange rates"),
  });

  const convertAmount = (amount: number, fromCurrency: string) => {
    if (!exchangeRates?.[currency] || !exchangeRates?.[fromCurrency])
      return amount;
    return (amount * exchangeRates[currency]) / exchangeRates[fromCurrency];
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast.error("You must be logged in to delete expenses");
      return;
    }
    const toastId = toast.loading("Deleting expense...");
    try {
      await axios.delete(`/api/expenses/${id}?userId=${user.uid}`);
      queryClient.invalidateQueries({ queryKey: ["expenses", user.uid] });
      toast.success("Expense deleted successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to delete expense", { id: toastId });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditDescription(expense.description);
    setEditCurrency(expense.currency);
    setEditDate(new Date(expense.date));
    setEditError("");
    setShowSuccess(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setEditError("You must be logged in");
      return;
    }
    if (!editDate) {
      setEditError("Please select a date");
      return;
    }
    if (!editAmount || parseFloat(editAmount) <= 0) {
      setEditError("Please enter a valid amount greater than 0");
      return;
    }

    const toastId = toast.loading("Updating expense...");
    setIsSubmitting(true);
    try {
      await axios.put(`/api/expenses/${editingExpense!.id}`, {
        userId: user.uid,
        amount: parseFloat(editAmount),
        category: editCategory,
        description: editDescription,
        currency: editCurrency,
        date: editDate.toISOString(),
      });
      toast.success("Expense updated!", { id: toastId });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setEditingExpense(null);
      queryClient.invalidateQueries({ queryKey: ["expenses", user.uid] });
    } catch (err) {
      toast.error("Failed to update expense", { id: toastId });
      setEditError("Failed to update expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setEditingExpense(null);
    setEditError("");
    setShowSuccess(false);
  };

  const toggleSort = (field: "date" | "amount") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedExpenses = expenses
    .filter(
      (expense) =>
        filterCategory === "All" || expense.category === filterCategory
    )
    .sort((a, b) => {
      const aValue =
        sortBy === "date"
          ? new Date(a.date).getTime()
          : convertAmount(a.amount, a.currency);
      const bValue =
        sortBy === "date"
          ? new Date(b.date).getTime()
          : convertAmount(b.amount, b.currency);
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 max-w-4xl mx-auto mt-6"
      role="region"
      aria-labelledby="expense-list-title"
    >
      <h2
        id="expense-list-title"
        className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6"
      >
        Expenses
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="currency"
          >
            Display Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors w-full sm:w-40"
          >
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="category-filter"
          >
            Filter by Category
          </label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors w-full sm:w-40"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => toggleSort("date")}
            className="p-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-md hover:from-gray-300 hover:to-gray-400 transition-colors flex items-center gap-1"
            aria-label={`Sort by date (${
              sortBy === "date" && sortOrder === "asc"
                ? "ascending"
                : "descending"
            })`}
          >
            Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => toggleSort("amount")}
            className="p-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-md hover:from-gray-300 hover:to-gray-400 transition-colors flex items-center gap-1"
            aria-label={`Sort by amount (${
              sortBy === "amount" && sortOrder === "asc"
                ? "ascending"
                : "descending"
            })`}
          >
            Amount {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-600"
        >
          Loading expenses...
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
      {!isLoading && !error && filteredAndSortedExpenses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 py-8"
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14A2 2 0 0022 16V8a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2">No expenses found. Add some expenses above!</p>
        </motion.div>
      )}
      {!isLoading && !error && filteredAndSortedExpenses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedExpenses.map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className={`p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                categoryStyles[expense.category]?.bg || "bg-gray-100"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {format(new Date(expense.date), "MMM dd, yyyy")}
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {categoryStyles[expense.category]?.icon}{" "}
                    {expense.description || expense.category}
                  </p>
                  <p className="text-sm text-gray-600">{expense.category}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Edit expense"
                    aria-label={`Edit expense: ${
                      expense.description || expense.category
                    }`}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete expense"
                    aria-label={`Delete expense: ${
                      expense.description || expense.category
                    }`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-lg font-bold text-blue-600">
                {convertAmount(expense.amount, expense.currency).toFixed(2)}{" "}
                {currency}
              </p>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {editingExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-100/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-labelledby="edit-expense-title"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full"
            >
              <h3
                id="edit-expense-title"
                className="text-xl font-semibold text-gray-800 mb-4"
              >
                Edit Expense
              </h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="edit-amount"
                  >
                    Amount
                  </label>
                  <input
                    id="edit-amount"
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                    placeholder="Enter amount (e.g., 25.50)"
                    step="0.01"
                    min="0.01"
                    disabled={isSubmitting}
                    aria-describedby="edit-amount-error"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="edit-category"
                  >
                    Category
                  </label>
                  <select
                    id="edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="edit-description"
                  >
                    Description
                  </label>
                  <input
                    id="edit-description"
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Enter description (optional)"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="edit-currency"
                  >
                    Currency
                  </label>
                  <select
                    id="edit-currency"
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="edit-date"
                  >
                    Date
                  </label>
                  <CustomDatePicker
                    selected={editDate}
                    onChange={(date: Date | null) => setEditDate(date)}
                    disabled={isSubmitting}
                  />
                </div>
                <AnimatePresence>
                  {editError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-sm"
                      id="edit-amount-error"
                    >
                      {editError}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full sm:w-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-md hover:from-blue-600 hover:to-indigo-600 transition-colors disabled:cursor-not-allowed flex items-center justify-center"
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    ) : showSuccess ? (
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                    ) : null}
                    {isSubmitting
                      ? "Updating..."
                      : showSuccess
                      ? "Updated!"
                      : "Update Expense"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="w-full sm:w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 p-2 rounded-md hover:from-gray-300 hover:to-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
