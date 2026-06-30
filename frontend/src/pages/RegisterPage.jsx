import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, Eye, EyeOff, MessageCircle, AtSign } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData, navigate);
  };

  const Field = ({ icon: Icon, type, placeholder, field, extra }) => (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      <input
        type={field === "password" ? (showPass ? "text" : "password") : type}
        required
        placeholder={placeholder}
        value={formData[field]}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33]
                   text-gray-900 dark:text-[#e9edef] placeholder-gray-400 dark:placeholder-[#8696a0]
                   border-0 outline-none text-[15px]
                   focus:ring-2 focus:ring-[#00a884] transition-shadow"
      />
      {field === "password" && (
        <button
          type="button"
          onClick={() => setShowPass(v => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 tap-target"
        >
          {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
      {extra}
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white dark:bg-[#111b21] overflow-y-auto">

      {/* ── Compact hero (shorter than login since form is longer) ── */}
      <div className="relative flex flex-col items-center justify-center pt-12 pb-10 px-6
                      bg-gradient-to-b from-[#00a884] to-[#008f6f] dark:from-[#202c33] dark:to-[#111b21]">
        <div className="w-16 h-16 rounded-[22px] bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg mb-3">
          <MessageCircle className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Chat App</h1>
        <p className="text-white/70 text-sm mt-0.5">Create your free account</p>

        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 40" preserveAspectRatio="none">
          <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z"
                className="fill-white dark:fill-[#111b21]" />
        </svg>
      </div>

      {/* ── Form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-8 max-w-md mx-auto w-full">

        <h2 className="text-xl font-semibold text-gray-800 dark:text-[#e9edef] mb-5">
          Sign up
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text" required placeholder="Full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33]
                         text-gray-900 dark:text-[#e9edef] placeholder-gray-400 dark:placeholder-[#8696a0]
                         border-0 outline-none text-[15px] focus:ring-2 focus:ring-[#00a884] transition-shadow"
            />
          </div>

          {/* Username */}
          <div className="relative">
            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text" required placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33]
                         text-gray-900 dark:text-[#e9edef] placeholder-gray-400 dark:placeholder-[#8696a0]
                         border-0 outline-none text-[15px] focus:ring-2 focus:ring-[#00a884] transition-shadow"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="email" required placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33]
                         text-gray-900 dark:text-[#e9edef] placeholder-gray-400 dark:placeholder-[#8696a0]
                         border-0 outline-none text-[15px] focus:ring-2 focus:ring-[#00a884] transition-shadow"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type={showPass ? "text" : "password"} required placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33]
                         text-gray-900 dark:text-[#e9edef] placeholder-gray-400 dark:placeholder-[#8696a0]
                         border-0 outline-none text-[15px] focus:ring-2 focus:ring-[#00a884] transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 tap-target"
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSigningUp}
            className="w-full py-3.5 rounded-2xl bg-[#00a884] hover:bg-[#008f6f] active:scale-[0.98]
                       text-white font-semibold text-[16px] shadow-md
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-150 mt-2 flex items-center justify-center gap-2"
          >
            {isSigningUp ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#2a3942]" />
          <span className="text-xs text-gray-400 dark:text-[#8696a0] font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#2a3942]" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              useAuthStore.getState().googleLogin(credentialResponse.credential);
            }}
            onError={() => toast.error("Google Sign Up Failed")}
            shape="pill"
            size="large"
            width="300"
          />
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-[#8696a0] mt-8">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#00a884] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
