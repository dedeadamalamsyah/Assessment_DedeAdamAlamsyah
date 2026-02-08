import React, { useState, useEffect, useRef, useContext, ChangeEvent } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { validateQR } from "../utils/qrHandler";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import Dashboard, { ScanRecord } from "./Dashboard";

const Scanner: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 10;

  useEffect(() => {
    fetchHistory();
    return () => { stopScanner(); };
  }, []);

  async function fetchHistory(search = "", page = 1) {
    try {
      const { data } = await api.get(
        `/scans?search=${search}&page=${page}&pageSize=${pageSize}`
      );
      setHistory(data.data);
      setTotalItems(data.total);
      setCurrentPage(data.currentPage);
    } catch (err) {
      console.error("Gagal load history:", err);
    }
  }

  const processResult = async (decodedText: string) => {
    const validation = validateQR(decodedText);

    try {
      await api.post("/scans", {
        qrCodeContent: decodedText,
        isValid: validation.isValid,
        notes: "Scanned via Web App",
      });

      await stopScanner();
      setMessage(validation.message);
      fetchHistory(searchTerm);
    } catch (err) {
      console.error("Gagal simpan ke DB", err);
      setMessage("Gagal menyimpan ke server");
    }
  };

  const startScanner = async (useFront = false) => {
    try {
      if (scannerRef.current) await stopScanner();
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      setIsScanning(true);
      setIsFrontCamera(useFront);

      await html5QrCode.start(
        { facingMode: useFront ? "user" : "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => processResult(decodedText),
        () => {},
      );
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
      } catch (err) {
        console.warn(err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleFileScan = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("reader");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      await processResult(decodedText);
      e.target.value = "";
    } catch (err) {
      console.error(err);
      setMessage("Format QR tidak ditemukan atau error sistem");
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/scans/export", { responseType: "blob" });
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}`;
      const timeStr = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `Halotec_Report_${dateStr}_${timeStr}.csv`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Gagal export CSV");
    }
  };

  const handleUpdateNotes = async (id: number, newNotes: string) => {
    try {
      await api.put(`/scans/${id}`, { notes: newNotes });
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, notes: newNotes } : item
        )
      );
    } catch (err) {
      console.error("Gagal update notes:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Yakin mau hapus data ini?")) {
      try {
        await api.delete(`/scans/${id}`);
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } catch {
        alert("Gagal menghapus data");
      }
    }
  };

  const fetchScanById = async (id: number) => {
    try {
      const { data } = await api.get(`/scans/${id}`);
      setSelectedScan(data);
    } catch {
      alert("Gagal mengambil detail data");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 font-sans">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-black italic text-indigo-900 uppercase">
          Scanner
        </h1>
        {user && (
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
            {user.username}
          </p>
        )}
        <button
          onClick={logout}
          className="text-[9px] font-black text-red-500 uppercase px-2 py-1 bg-red-50 rounded-lg"
        >
          Logout
        </button>
      </header>
      <Dashboard history={history} totalFromApi={totalItems} />
      <div className="bg-gray-100 rounded-3xl shadow-lg overflow-hidden border-4 border-white mb-6">
        <div
          className={`relative aspect-square flex items-center justify-center bg-black ${isFrontCamera ? "mirror-view" : ""}`}
        >
          <div id="reader" className="w-full h-full"></div>

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-20 gap-4">
              <button
                onClick={() => startScanner(false)}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs shadow-xl active:scale-95 transition-all"
              >
                Buka Kamera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/20 text-white border border-white/30 px-6 py-2 rounded-xl font-bold text-xs uppercase hover:bg-white/30 transition-all"
              >
                Scan dari Galeri
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileScan}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}
        </div>

        {isScanning && (
          <div className="p-3 bg-white flex flex-col gap-2 border-t">
            <button
              onClick={() => startScanner(!isFrontCamera)}
              className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-[10px] uppercase"
            >
              {isFrontCamera ? "Kamera Belakang" : "Kamera Depan"}
            </button>
            <button
              onClick={stopScanner}
              className="w-full py-2 bg-red-50 text-red-600 rounded-lg font-bold text-[10px] uppercase"
            >
              Berhenti
            </button>
          </div>
        )}
      </div>
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border-2 text-center font-bold ${message.includes("Valid") ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          {message}
        </div>
      )}
      <div className="mb-4">
        <input
          type="text"
          placeholder="CARI DATA..."
          className="w-full p-2 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            fetchHistory(e.target.value);
          }}
        />
      </div>
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-[10px] font-black uppercase text-gray-400">
          Riwayat
        </h2>
        <button
          onClick={handleExport}
          className="text-indigo-600 text-[10px] font-bold uppercase"
        >
          Export
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => fetchScanById(item.id)}
            className="group relative p-3 bg-white border border-gray-100 rounded-xl mb-2 cursor-pointer hover:bg-gray-50 transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-mono text-xs font-black text-indigo-900 truncate max-w-35">
                  {item.qrCodeContent}
                </p>
                <p className="text-[8px] text-gray-400 uppercase">
                  {new Date(item.scannedAt).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-lg text-[9px] font-black ${item.isValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {item.isValid ? "VALID" : "INVALID"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="p-1 text-red-300 hover:text-red-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
              <input
                type="text"
                placeholder="Tambah catatan..."
                defaultValue={item.notes}
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => handleUpdateNotes(item.id, e.target.value)}
                className="w-full bg-transparent text-[10px] text-gray-500 italic outline-none focus:text-indigo-600"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center px-1">
        <button
          disabled={currentPage === 1}
          onClick={() => fetchHistory(searchTerm, currentPage - 1)}
          className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase disabled:opacity-30"
        >
          Prev
        </button>

        <span className="text-[9px] font-black text-gray-400 uppercase">
          Halaman {currentPage} dari {Math.ceil(totalItems / pageSize)}
        </span>

        <button
          disabled={currentPage >= Math.ceil(totalItems / pageSize)}
          onClick={() => fetchHistory(searchTerm, currentPage + 1)}
          className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase disabled:opacity-30"
        >
          Next
        </button>
      </div>
      {selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-black uppercase text-indigo-900 mb-4 text-center">
              Detail Scan
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">
                  Konten QR
                </label>
                <div className="bg-gray-50 p-3 rounded-xl font-mono text-xs break-all border border-gray-100">
                  {selectedScan.qrCodeContent}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">
                  Edit Catatan
                </label>
                <textarea
                  className="w-full bg-gray-50 p-3 rounded-xl text-sm border border-gray-100 focus:ring-2 focus:ring-indigo-300 outline-none"
                  defaultValue={selectedScan.notes}
                  placeholder="Tulis catatan di sini..."
                  onBlur={(e) =>
                    handleUpdateNotes(selectedScan.id, e.target.value)
                  }
                />
              </div>
            </div>

            <button
              onClick={() => setSelectedScan(null)}
              className="w-full mt-6 py-3 bg-indigo-900 text-white rounded-xl font-bold uppercase text-xs"
            >
              Simpan & Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;