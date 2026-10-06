"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  function toggleTheme() {
    const nextMode = !darkMode;

    setDarkMode(nextMode);

    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border bg-white text-xl shadow-lg transition hover:scale-105 dark:border-gray-700 dark:bg-gray-800"
    >
      {darkMode ? "☀️" : "🌙"}
    </button>
  );
}