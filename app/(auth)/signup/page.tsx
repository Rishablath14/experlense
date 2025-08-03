"use client";
import { useState } from "react";
import { signUp, signInWithGoogle } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleIcon } from "@/components/Icons";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const toastId = toast.loading("Signing up...");
    try {
      await signUp(email, password);
      toast.success("Signed up successfully!", { id: toastId });
      router.push("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err.code === "auth/weak-password"
          ? "Password should be at least 6 characters"
          : "Failed to sign up";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    }
  };

  const handleGoogleSignUp = async () => {
    const toastId = toast.loading("Signing up with Google...");
    try {
      await signInWithGoogle();
      toast.success("Signed up with Google!", { id: toastId });
      router.push("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error("Failed to sign up with Google", { id: toastId });
      setError("Failed to sign up with Google");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4"
    >
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          Sign Up to ExpeRLense
        </h1>
        <form
          onSubmit={handleEmailSubmit}
          className="space-y-4"
          role="form"
          aria-labelledby="signup-form-title"
        >
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
              required
              placeholder="Enter your email"
              aria-describedby="email-error"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md bg-gradient-to-r from-gray-50 to-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
              required
              placeholder="Enter your password (min 6 characters)"
              aria-describedby="password-error"
            />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-sm text-center"
                id="email-error password-error"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white p-2 rounded-md hover:from-green-600 hover:to-teal-600 transition-colors focus:ring-2 focus:ring-green-400 focus:outline-none"
            aria-label="Sign up with email"
          >
            Sign Up
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={handleGoogleSignUp}
            className="w-full bg-white border border-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            aria-label="Sign up with Google"
          >
            <GoogleIcon className="w-5 h-5" />
            Sign Up with Google
          </button>
        </div>
        <p className="mt-4 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Login
          </a>
        </p>
      </div>
    </motion.div>
  );
}
