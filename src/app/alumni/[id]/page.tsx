"use client";

import { useEffect, useState } from "react";
import { BuktiPelacakan, DataAlumni } from "@/types";
import { Loader2, ArrowLeft, ExternalLink, ShieldCheck, MapPin, Building2, Briefcase } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DetailAlumni() {
  const params = useParams();
  const id = params.id as string;
  
  const [history, setHistory] = useState<BuktiPelacakan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/history/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Jejak Bukti Pelacakan</h1>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">Belum ada jejak bukti pelacakan untuk alumni ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((h, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className={h.confidence_score > 0.7 ? "text-green-500" : "text-yellow-500"} size={20} />
                  <span className="font-medium text-gray-900">
                    Sinyal dari {h.sumber_temuan}
                  </span>
                </div>
                <div className="text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  Confidence: {(h.confidence_score * 100).toFixed(0)}%
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Informasi Puncak</h3>
                  
                  <div className="flex items-start space-x-3">
                    <Briefcase className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Jabatan/Peran</p>
                      <p className="font-medium text-gray-900">{h.ringkasan_info.jabatan || "-"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Building2 className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Instansi/Afiliasi</p>
                      <p className="font-medium text-gray-900">{h.ringkasan_info.instansi || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Lokasi</p>
                      <p className="font-medium text-gray-900">{h.ringkasan_info.lokasi || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-l border-gray-200 pl-6">
                   <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Evidence (Bukti Publik)</h3>
                   <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 italic border border-gray-200">
                     &quot;{h.bukti_pointer.snippet}&quot;
                   </div>
                   <a 
                     href={h.bukti_pointer.url} 
                     target="_blank" 
                     rel="noreferrer"
                     className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                   >
                     <ExternalLink size={16} />
                     <span>Kunjungi Profil Sumber ({h.sumber_temuan})</span>
                   </a>
                   <div className="pt-2">
                     <p className="text-xs text-gray-500">Waktu Ditemukan: {new Date(h.tanggal_ditemukan).toLocaleString('id-ID')}</p>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
