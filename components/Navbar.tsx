"use client";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const [user] = useAuthState(auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
          ExpeRLense
        </Link>
        <div className="hidden sm:flex space-x-6 items-center">
          <Link
            href="/dashboard/expenses"
            className="text-base hover:text-gray-200 transition-colors"
          >
            Expenses
          </Link>
          <Link
            href="/dashboard/analytics"
            className="text-base hover:text-gray-200 transition-colors"
          >
            Analytics
          </Link>
          {user && (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors focus:ring-2 focus:ring-red-400 focus:outline-none"
              aria-label="Log out"
            >
              Logout
            </button>
          )}
        </div>
        <button
          className="sm:hidden text-white focus:outline-none"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="sm:hidden bg-gradient-to-r from-blue-700 to-indigo-700 mt-2 rounded-md shadow-lg overflow-hidden"
            role="menu"
          >
            <div className="flex flex-col p-4 space-y-4">
              <Link
                href="/dashboard/expenses"
                className="text-base hover:text-gray-200 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
              >
                Expenses
              </Link>
              <Link
                href="/dashboard/analytics"
                className="text-base hover:text-gray-200 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
              >
                Analytics
              </Link>
              {user && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-left focus:ring-2 focus:ring-red-400 focus:outline-none"
                  role="menuitem"
                  aria-label="Log out"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
