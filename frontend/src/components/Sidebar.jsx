import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Megaphone, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTenant } from '../contexts/TenantContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Content Calendar', href: '/content', icon: Calendar },
  { name: 'Ad Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const { tenant, user } = useTenant();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <span className="text-xl font-bold text-primary-600 truncate">
            {tenant?.name || 'D1 Growth'}
          </span>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary-50 text-primary-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon size={20} className={cn(
              "shrink-0",
              collapsed && "mx-auto"
            )} />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button className="mt-4 flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};
