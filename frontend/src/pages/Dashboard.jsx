import React from 'react';
import { 
  Users, 
  Calendar, 
  Megaphone, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';

const StatCard = ({ title, value, change, trend, icon: Icon }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
        <Icon size={24} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {change}%
        </div>
      )}
    </div>
    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export const Dashboard = () => {
  const { tenant } = useTenant();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {tenant?.name}!</h1>
        <p className="text-gray-500 mt-1">Here is what's happening with your marketing today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Leads" 
          value="1,284" 
          change="12" 
          trend="up" 
          icon={Users} 
        />
        <StatCard 
          title="Content Scheduled" 
          value="14" 
          change="8" 
          trend="up" 
          icon={Calendar} 
        />
        <StatCard 
          title="Active Ads" 
          value="6" 
          change="2" 
          trend="down" 
          icon={Megaphone} 
        />
        <StatCard 
          title="Lead Score Avg" 
          value="74" 
          change="5" 
          trend="up" 
          icon={TrendingUp} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placeholder for Recent Leads */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Leads</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                    L{i}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Lead Person {i}</p>
                    <p className="text-xs text-gray-500">Source: Facebook Ads</p>
                  </div>
                </div>
                <div className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                  Hot
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 text-sm font-medium text-primary-600 hover:text-primary-700">
            View all leads
          </button>
        </div>

        {/* Placeholder for Content Calendar Preview */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Content</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg bg-gray-50">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded flex items-center justify-center text-primary-600">
                  <Calendar size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Instagram Educational Post</p>
                  <p className="text-xs text-gray-500 mt-1">Scheduled for: tomorrow, 10:00 AM</p>
                </div>
                <div className="px-2 py-1 h-fit rounded text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700">
                  AI Ready
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 text-sm font-medium text-primary-600 hover:text-primary-700">
            Go to calendar
          </button>
        </div>
      </div>
    </div>
  );
};
