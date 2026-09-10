import { Link } from 'react-router-dom';
import {
  Boxes,
  Handshake,
  LifeBuoy,
  Map,
  ShoppingCart,
  Truck,
  Trophy,
  Warehouse,
} from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';

const BASE_LINKS = [
  {
    to: '/lots-marketplace',
    icon: Boxes,
    label: 'Lots Marketplace',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    to: '/my-offers',
    icon: Handshake,
    label: 'My Offers',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    to: '/orders',
    icon: ShoppingCart,
    label: 'Orders',
    color: 'bg-orange-50 text-orange-700',
  },
  {
    to: '/demand-map',
    icon: Map,
    label: 'Demand Overview',
    color: 'bg-cyan-50 text-cyan-700',
  },
  {
    to: '/trust-rankings',
    icon: Trophy,
    label: 'Trust Rankings',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    to: '/support-tickets',
    icon: LifeBuoy,
    label: 'Support',
    color: 'bg-rose-50 text-rose-700',
  },
];

const LOGISTICS_LINK = {
  to: '/logistics',
  icon: Truck,
  label: 'Logistics',
  color: 'bg-teal-50 text-teal-700',
};

const STORAGE_LINK = {
  to: '/storage',
  icon: Warehouse,
  label: 'Storage',
  color: 'bg-indigo-50 text-indigo-700',
};

export default function SupporterHome() {
  const {
    supporterType,
    loading,
  } = useUserRole();

  const isLogistics =
    supporterType === 'logistics_provider';

  const isStorage =
    supporterType === 'cold_storage_provider' ||
    supporterType === 'warehouse_provider';

  const quickLinks = [
    ...BASE_LINKS,
    ...(isLogistics ? [LOGISTICS_LINK] : []),
    ...(isStorage ? [STORAGE_LINK] : []),
  ];

  return (
    <div className="space-y-5 px-4 pt-6 pb-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-emerald-800">
          🤝 AgriSaathi
        </h1>

        <p className="text-sm text-gray-500">
          {loading
            ? 'Loading your supporter profile…'
            : 'Supporter / Vendor Portal'}
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-500">
          Your Tools
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map(
            ({
              to,
              icon: Icon,
              label,
              color,
            }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </span>

                <span className="text-center text-[11px] leading-tight text-gray-600">
                  {label}
                </span>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
