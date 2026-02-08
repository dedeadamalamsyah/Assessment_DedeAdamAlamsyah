import React from "react";

export interface ScanRecord {
  id: number;
  qrCodeContent: string;
  isValid: boolean;
  notes: string;
  scannedAt: string;
}

interface DashboardProps {
  history: ScanRecord[];
  totalFromApi: number;
}

const Dashboard: React.FC<DashboardProps> = ({ history, totalFromApi }) => {
  const stats = {
    total: totalFromApi || 0,
    valid: history.filter((s) => s.isValid).length,
    invalid: history.filter((s) => !s.isValid).length,
  };

  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      <div className="bg-indigo-900 p-3 rounded-2xl text-white shadow-sm">
        <p className="text-[8px] font-black uppercase opacity-60 mb-1">Total</p>
        <h3 className="text-xl font-black">{stats.total}</h3>
      </div>
      <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-sm">
        <p className="text-[8px] font-black uppercase opacity-60 mb-1">Valid</p>
        <h3 className="text-xl font-black">{stats.valid}</h3>
      </div>
      <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-sm">
        <p className="text-[8px] font-black uppercase opacity-60 mb-1">Error</p>
        <h3 className="text-xl font-black">{stats.invalid}</h3>
      </div>
    </div>
  );
};

export default Dashboard;