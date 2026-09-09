import { Link } from "react-router-dom";
import { TrendingUp, ShieldCheck, Truck } from "lucide-react";
import PhotoBackdrop from "../components/PhotoBackdrop";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <PhotoBackdrop
        query="farmer ploughing field with oxen"
        overlayClassName="absolute inset-0 bg-white/70"
      />

      <div className="w-full max-w-2xl relative">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-3 shadow-sm">
            <span className="text-white text-2xl">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">AgriSaathi</h1>
          <p className="text-sm text-gray-600">One Voice, Every Acre, Every Plot</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          <div className="bg-white/95 rounded-2xl p-6 shadow-xl border border-gray-100 text-left flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
              <span className="text-emerald-700 text-xl">🌱</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">I am a Farmer</h2>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              Register your farm, check quality, find best markets, sell to verified buyers, and track payments.
            </p>
            <Link
              to="/register?role=farmer"
              className="text-emerald-700 font-semibold text-sm hover:text-emerald-800"
            >
              Enter Farmer Portal →
            </Link>
          </div>

          <div className="bg-white/95 rounded-2xl p-6 shadow-xl border border-gray-100 text-left flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
              <span className="text-emerald-700 text-xl">🤝</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">I am a Supporter / Vendor</h2>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              Buyers, traders, processors, logistics, warehouse, cold storage, market operators — connect with farmers.
            </p>
            <Link
              to="/register?role=supporter"
              className="text-emerald-700 font-semibold text-sm hover:text-emerald-800"
            >
              Enter Supporter Portal →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 rounded-xl p-4">
            <TrendingUp className="h-5 w-5 text-emerald-700 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-800">Live Mandi Prices</p>
            <p className="text-xs text-gray-500">Data.gov.in integration</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-700 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-800">Quality Verification</p>
            <p className="text-xs text-gray-500">AI + blockchain ready</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4">
            <Truck className="h-5 w-5 text-emerald-700 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-800">Logistics Tracking</p>
            <p className="text-xs text-gray-500">GPS-enabled trips</p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
            Admin login →
          </Link>
        </div>
      </div>
    </div>
  );
}
