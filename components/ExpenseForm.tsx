"use client";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import CustomDatePicker from "./DatePicker";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function ExpenseForm() {
  const [user] = useAuthState(auth);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState<Date | null>(new Date());
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const categories = [
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
  const currencies = ["USD", "EUR", "GBP", "AED", "INR"];

  const validateForm = () => {
    if (!user) {
      setError("You must be logged in");
      return false;
    }
    if (!date) {
      setError("Please select a date");
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    const toastId = toast.loading("Adding expense...");
    setIsSubmitting(true);
    try {
      await axios.post("/api/expenses", {
        userId: user!.uid,
        amount: parseFloat(amount),
        category,
        description,
        currency,
        date: date!.toISOString(),
      });
      toast.success("Expense added successfully!", { id: toastId });
      setAmount("");
      setDescription("");
      setCategory("Food");
      setCurrency("USD");
      setDate(new Date());
      queryClient.invalidateQueries({ queryKey: ["expenses", user!.uid] });
    } catch (err) {
      toast.error("Failed to add expense", { id: toastId });
      setError("Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setAmount("");
    setDescription("");
    setCategory("Food");
    setCurrency("USD");
    setDate(new Date());
    setError("");
    toast.success("Form cleared");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 max-w-4xl mx-auto"
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
            required
            placeholder="Enter amount"
            step="0.01"
            min="0.01"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
            disabled={isSubmitting}
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
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="Enter description (optional)"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <CustomDatePicker
            selected={date}
            onChange={(date: Date | null) => setDate(date)}
            disabled={isSubmitting}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-md hover:from-blue-600 hover:to-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Expense
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isSubmitting}
            className="w-full sm:w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 p-2 rounded-md hover:from-gray-300 hover:to-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <TrashIcon className="w-5 h-5" />
            Clear Form
          </button>
        </div>
      </form>
    </motion.div>
  );
}
