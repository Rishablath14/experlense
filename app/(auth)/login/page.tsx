"use client";
import { useState } from "react";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleIcon } from "@/components/Icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const toastId = toast.loading("Signing in...");
    try {
      await signInWithEmail(email, password);
      toast.success("Signed in successfully!", { id: toastId });
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Invalid credentials", { id: toastId });
      setError("Invalid credentials");
    }
  };

  const handleGoogleSignIn = async () => {
    const toastId = toast.loading("Signing in with Google...");
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!", { id: toastId });
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Failed to sign in with Google", { id: toastId });
      setError("Failed to sign in with Google");
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
          Login to ExpeRLense
        </h1>
        <form
          onSubmit={handleEmailSubmit}
          className="space-y-4"
          role="form"
          aria-labelledby="login-form-title"
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
              placeholder="Enter your password"
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
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-md hover:from-blue-600 hover:to-indigo-600 transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
            aria-label="Sign in with email"
          >
            Sign In
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border border-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            aria-label="Sign in with Google"
          >
            <GoogleIcon className="w-5 h-5" />
            Sign In with Google
          </button>
        </div>
        <p className="mt-4 text-center text-gray-600 text-sm">
          <a href="/forgot-password" className="text-blue-500 hover:underline">
            Forgot Password?
          </a>
        </p>
        <p className="mt-2 text-center text-gray-600 text-sm">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </motion.div>
  );
}
