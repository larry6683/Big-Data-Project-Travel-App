// frontend/app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { travelApi } from "../../services/api";
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  PlaneTakeoff,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Specific field errors for validation
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const auth = useAuth() as any;
  const router = useRouter();

  const validateForm = () => {
    const errors: { name?: string; email?: string; password?: string } = {};
    let isValid = true;

    // Name Validation (Only for Sign Up)
    if (!isLogin && name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
      isValid = false;
    }

    // Email Validation (Basic Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "Email is required.";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
      isValid = false;
    }

    // Password Validation
    if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // 1. Make the API call using travelApi
        const res = await travelApi.login(email, password);

        // 2. Save the token to your AuthContext
        auth.login(res.access_token, res.email);
      } else {
        // 1. Make the API call using travelApi
        const res = await travelApi.signup(name, email, password);

        // 2. Save the token to your AuthContext
        auth.login(res.access_token, res.email);
      }

      router.push("/");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Authentication failed. Please try again.";
      setGlobalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  // Helper to clear errors when user starts typing
  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, field: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (fieldErrors[field as keyof typeof fieldErrors]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <div className="min-h-screen flex w-full font-sans bg-[#fafcff]">
      {/* LEFT HALF: Beautiful Itinerary/Travel Image (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden items-end justify-start pb-20 pl-16">
        {/* High-quality travel placeholder image from Unsplash */}
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
          alt="Beautiful travel destination"
          className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-[20s] hover:scale-105"
        />

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>

        {/* Overlay Content */}
        <div className="relative z-10 max-w-lg text-white animate-in fade-in slide-in-from-left-8 duration-1000 delay-300 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest mb-6">
            <SparkleIcon /> Smart Planning
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4 leading-[1.1]">
            Your next great adventure,{" "}
            <span className="text-blue-400">planned in seconds.</span>
          </h1>
          <p className="text-lg text-slate-300 font-medium">
            Let our AI craft the perfect itinerary tailored to your unique
            travel style, budget, and dreams.
          </p>
        </div>
      </div>

      {/* RIGHT HALF: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative p-6 sm:p-12 overflow-hidden">
        {/* Decorative Ambient Background Gradients for the form side */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/15 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/15 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile Only Logo Section */}
          <div className="lg:hidden text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-3xl font-extrabold text-slate-900 tracking-tight"
            >
              <PlaneTakeoff
                className="text-blue-600"
                size={32}
                strokeWidth={2.5}
              />
              WanderPlan <span className="text-blue-600">US</span>
            </Link>
          </div>

          <div className="hidden lg:block mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              {isLogin
                ? "Enter your details to access your trips."
                : "Start planning your dream vacation today."}
            </p>
          </div>

          {/* Main Glassmorphism Form Container */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Animated Toggle Switch */}
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 relative">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${
                  isLogin ? "left-1" : "left-[calc(50%+2px)]"
                }`}
              ></div>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setGlobalError("");
                  setFieldErrors({});
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors duration-300 z-10 ${
                  isLogin
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setGlobalError("");
                  setFieldErrors({});
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors duration-300 z-10 ${
                  !isLogin
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Global Error Bubble */}
              {globalError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center animate-in fade-in zoom-in-95 duration-200 flex items-center justify-center gap-2">
                  <span>⚠️</span> {globalError}
                </div>
              )}

              {/* Name Input (Sign Up Only) */}
              {!isLogin && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="relative group">
                    <div
                      className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                        fieldErrors.name
                          ? "text-red-400"
                          : "text-slate-400 group-focus-within:text-blue-500"
                      }`}
                    >
                      <UserIcon size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={handleInputChange(setName, "name")}
                      className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        fieldErrors.name
                          ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                          : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              )}

              {/* Email Input */}
              <div>
                <div className="relative group">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                      fieldErrors.email
                        ? "text-red-400"
                        : "text-slate-400 group-focus-within:text-blue-500"
                    }`}
                  >
                    <Mail size={18} />
                  </div>
                  <input
                    type="text" // using text so custom validation handles errors instead of native browser popups
                    placeholder="Email Address"
                    value={email}
                    onChange={handleInputChange(setEmail, "email")}
                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      fieldErrors.email
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="relative group">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                      fieldErrors.password
                        ? "text-red-400"
                        : "text-slate-400 group-focus-within:text-blue-500"
                    }`}
                  >
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={handleInputChange(setPassword, "password")}
                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      fieldErrors.password
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {isLogin && (
                <div className="flex justify-end mt-[-8px] animate-in fade-in duration-300">
                  <button
                    type="button"
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_25px_-6px_rgba(37,99,235,0.5)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Google Login Divider */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Or continue with
              </span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            {/* Full-width Google Button */}
            <div className="mt-6">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-sm font-bold text-slate-700 transition-all shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <p className="text-center text-xs text-slate-500 font-medium mt-8 animate-in fade-in duration-1000">
            By continuing, you agree to WanderPlan's <br />
            <Link
              href="#"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple internal icon for the image overlay
function SparkleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-300"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
