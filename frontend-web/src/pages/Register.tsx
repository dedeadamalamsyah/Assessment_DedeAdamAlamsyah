import React, { useState, SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleRegister = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", formData);
      alert("Registrasi sukses! Silakan login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data || "Gagal daftar, cek lagi datanya.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-black italic text-indigo-900 mb-2">
          JOIN HALOTEC.
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Daftar buat mulai tracking scan lu.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="USERNAME"
            className="w-full p-4 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            className="w-full p-4 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="PASSWORD"
            className="w-full p-4 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-xs font-bold text-gray-400">
          UDAH PUNYA AKUN?{" "}
          <Link to="/login" className="text-indigo-600 underline">
            LOGIN DISINI
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;