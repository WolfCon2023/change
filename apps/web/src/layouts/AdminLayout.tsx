/**
 * Admin Portal Layout
 * Layout for IAM administration pages
 */

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  UserCog,
  Key,
  FileText,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  UserCheck,
  Compass,
  ClipboardList,
  ShieldAlert,
  Book,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useAdminStore } from '@/stores/admin.store';
import { useAdminContext } from '@/lib/admin-api';
import { IamPermission, PrimaryRole } from '@change/shared';
import type { IamPermissionType, PrimaryRoleType } from '@change/shared';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  permission?: IamPermissionType;
  /** Require a specific role to see this nav item */
  role?: PrimaryRoleType;
  /** Require any of these roles to see this nav item */
  roles?: PrimaryRoleType[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    permission: IamPermission.IAM_USER_READ,
  },
  {
    label: 'Roles',
    href: '/admin/roles',
    icon: Shield,
    permission: IamPermission.IAM_ROLE_READ,
  },
  {
    label: 'Groups',
    href: '/admin/groups',
    icon: UserCog,
    permission: IamPermission.IAM_GROUP_READ,
  },
  {
    label: 'Advisor Assignments',
    href: '/admin/advisor-assignments',
    icon: UserCheck,
    role: PrimaryRole.IT_ADMIN,
  },
  {
    label: 'Access Requests',
    href: '/admin/access-requests',
    icon: ClipboardCheck,
    permission: IamPermission.IAM_ACCESS_REQUEST_READ,
  },
  {
    label: 'API Keys',
    href: '/admin/api-keys',
    icon: Key,
    permission: IamPermission.IAM_API_KEY_READ,
  },
  {
    label: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: FileText,
    permission: IamPermission.IAM_AUDIT_READ,
  },
  {
    label: 'Access Reviews',
    href: '/admin/access-reviews',
    icon: ClipboardCheck,
    permission: IamPermission.IAM_ACCESS_REVIEW_READ,
  },
  {
    label: 'Review Campaigns',
    href: '/admin/access-review-campaigns',
    icon: ClipboardList,
    permission: IamPermission.IAM_ACCESS_REVIEW_READ,
  },
  {
    label: 'Security Gaps',
    href: '/admin/security-gaps',
    icon: ShieldAlert,
    permission: IamPermission.IAM_AUDIT_READ,
  },
  {
    label: 'Governance',
    href: '/admin/governance',
    icon: Compass,
    // Visible to all admin portal users - informational only
  },
  {
    label: 'Knowledge Base',
    href: '/admin/knowledge-base',
    icon: Book,
    // Visible to all admin portal users - training/documentation
  },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { setContext, hasPermission } = useAdminStore();
  const { data: adminContext, isLoading } = useAdminContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (adminContext) {
      setContext({
        permissions: adminContext.permissions as IamPermissionType[],
        roles: adminContext.roles as Array<{ id: string; name: string; permissions: IamPermissionType[] }>,
        currentTenantId: adminContext.tenantId,
        primaryRole: (adminContext as { primaryRole?: string }).primaryRole as import('@change/shared').PrimaryRoleType,
      });
    }
  }, [adminContext, setContext]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const currentPrimaryRole = adminContext?.primaryRole as PrimaryRoleType | undefined;

  const filteredNavItems = navItems.filter((item) => {
    // Check role-based restriction first
    if (item.role) {
      return currentPrimaryRole === item.role;
    }
    if (item.roles && item.roles.length > 0) {
      return currentPrimaryRole && item.roles.includes(currentPrimaryRole);
    }
    // Check permission-based restriction
    if (item.permission) {
      return hasPermission(item.permission);
    }
    // No restriction, show the item
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-semibold text-gray-900">Admin Portal</span>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-80 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-28 px-2 border-b border-gray-800">
            <div className="bg-white rounded-lg px-2 py-1">
              <img 
                src="/logo.png" 
                alt="C.H.A.N.G.E. Admin" 
                className="h-20 w-auto"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-80 pt-14 lg:pt-0">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
