export interface ScanValidationResult {
  isValid: boolean;
  message: string;
}

export interface LocalScanHistory {
  id: number;
  code: string;
  isValid: boolean;
  timestamp: string;
}

export const validateQR = (code: string): ScanValidationResult => {
  if (!code) return { isValid: false, message: "Kode tidak terdeteksi" };

  const suffix = "/HLTC";

  if (!code.endsWith(suffix)) {
    return { isValid: false, message: "Invalid. Format harus [CODE]/HLTC." };
  }

  if (code.length <= suffix.length) {
    return { isValid: false, message: "Kode terlalu pendek" };
  }

  return { isValid: true, message: "Valid" };
};

export const saveToHistory = (scanResult: { code: string; isValid: boolean }): LocalScanHistory[] => {
  const history: LocalScanHistory[] = JSON.parse(localStorage.getItem("scanHistory") || "[]");

  const newEntry: LocalScanHistory = {
    id: Date.now(),
    code: scanResult.code,
    isValid: scanResult.isValid,
    timestamp: new Date().toISOString()
  };

  const updatedHistory = [newEntry, ...history].slice(0, 50);
  localStorage.setItem("scanHistory", JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const exportToCSV = (history: LocalScanHistory[]): void => {
  if (history.length === 0) {
    alert("Riwayat kosong!");
    return;
  }

  const headers = ["ID", "Code", "Status", "Waktu Scan"];

  const rows = history.map(item => {
    const localTime = new Date(item.timestamp).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).replace(/\//g, "-");

    return [
      item.id,
      item.code,
      item.isValid ? "VALID" : "INVALID",
      localTime
    ];
  });

  const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `halotec_report_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};