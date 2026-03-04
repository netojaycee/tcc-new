"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User, Lock, Package, Shield } from "lucide-react";

const menuItems = [
  {
    label: "Profile",
    href: "/account-management/profile",
    icon: User,
    description: "Edit personal info about yourself",
  },
  {
    label: "Delivery Addresses",
    href: "/account-management/delivery-addresses",
    icon: Package,
    description: "View saved delivery locations",
  },
  {
    label: "Account Security",
    href: "/account-management/account-security",
    icon: Shield,
    description: "Change password, two factor auth, login device",
  },
];

function AccountSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 lg:transition-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 lg:p-6 sticky top-0 bg-white border-b border-gray-100 lg:border-0">
          <div className="flex items-center justify-between lg:justify-start">
            <h2 className="font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 lg:p-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default function AccountManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 bg-white border-b border-gray-200 z-20">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold text-gray-900">Account</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar - Desktop & Mobile */}
        <AccountSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Content Area */}
        <div className="flex-1 min-w-0 bg-gray-50 lg:p-8 p-4">
          <div className="bg-white rounded-lg lg:rounded-xl shadow-sm lg:shadow-md p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
