"use client";

import { useEffect, useState } from "react";
import { DataAlumni } from "@/types";
import { Search, Loader2, UserCheck, UserX, UserMinus } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [alumni, setAlumni] = useState<DataAlumni[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alumni")
      .then((res) => res.json())
      .then((data) => {
        setAlumni(data);
        setLoading(false);
      });
  }, []);

  const handleTrack = async (id: string) => {
    alert("Proses pelacakan dimulai... Mohon tunggu.");
    try {
      const res = await fetch(`/api/track/${id}`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        alert(`Pelacakan selesai! Status baru: ${data.updatedAlumni.status_lacak}`);
        // Refresh data
        setAlumni((prev) =>
          prev.map((a) => (a.id === id ? data.updatedAlumni : a))
        );
      } else {
        alert("Gagal melakukan pelacakan");
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Alumni</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">
          + Tambah Alumni
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Search size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Alumni</p>
            <p className="text-2xl font-semibold text-gray-900">{alumni.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Teridentifikasi</p>
            <p className="text-2xl font-semibold text-gray-900">
              {alumni.filter(a => a.status_lacak === "Teridentifikasi dari Sumber Publik").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
            <UserMinus size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Perlu Verifikasi</p>
            <p className="text-2xl font-semibold text-gray-900">
              {alumni.filter(a => a.status_lacak === "Perlu Verifikasi Manual").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-gray-100 rounded-full text-gray-600">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Belum Ada Hasil</p>
            <p className="text-2xl font-semibold text-gray-900">
              {alumni.filter(a => a.status_lacak === "Belum Ditemukan di Sumber Publik" || a.status_lacak === "Belum Dilacak").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Data Master & Status Pelacakan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama & Prodi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun Lulus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Pelacakan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alumni.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{a.nama}</div>
                    <div className="text-sm text-gray-500">{a.prodi} • {a.kota_asal}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {a.tahun_lulus}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      a.status_lacak.includes("Teridentifikasi") ? "bg-green-100 text-green-800" :
                      a.status_lacak.includes("Perlu Verifikasi") ? "bg-yellow-100 text-yellow-800" :
                      a.status_lacak.includes("Opt-Out") ? "bg-gray-100 text-gray-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {a.status_lacak}
                    </span>
                    {a.confidence_score > 0 && (
                       <div className="text-xs text-gray-400 mt-1">Skor: {(a.confidence_score * 100).toFixed(0)}%</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => handleTrack(a.id)}
                      disabled={a.status_lacak === "Opt-Out (Privasi)"}
                    >
                      {a.status_lacak === "Opt-Out (Privasi)" ? "✖ Privat" : "▶ Lacak"}
                    </button>
                    {(a.status_lacak.includes("Teridentifikasi") || a.status_lacak.includes("Perlu Verifikasi")) && (
                      <Link href={`/alumni/${a.id}`} className="text-indigo-600 hover:text-indigo-900">
                        Lihat Jejak Bukti
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
