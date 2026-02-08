import React, { useState, useContext, SubmitEvent } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { login } = useContext(AuthContext);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Email atau Password salah!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-indigo-900">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl">
        <div className="mb-10">
          <h1 className="text-4xl font-black italic text-indigo-900">LOGIN</h1>
          <div className="h-1 w-12 bg-indigo-600 mt-1"></div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-xs font-bold uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">
              Account Email
            </label>
            <input
              type="email"
              className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 outline-none font-bold transition-all"
              placeholder="name@company.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">
              Password
            </label>
            <input
              type="password"
              className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 outline-none font-bold transition-all"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all transform active:scale-95">
            Login
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            New Here?
          </span>
          <Link
            to="/register"
            className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
          >
            Create Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;