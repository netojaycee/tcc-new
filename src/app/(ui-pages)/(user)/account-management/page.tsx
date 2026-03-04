"use client";

import Link from "next/link";
import { User, MapPin, Shield, LogOut } from "lucide-react";

const sections = [
  {
    title: "Profile",
    description: "Edit your personal information",
    icon: User,
    href: "/account-management/profile",
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Delivery Addresses",
    description: "Manage your saved delivery locations",
    icon: MapPin,
    href: "/account-management/delivery-addresses",
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Account Security",
    description: "Change password and manage 2FA",
    icon: Shield,
    href: "/account-management/account-security",
    color: "bg-purple-50 text-purple-600",
  },
];

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Account Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your account information and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="block p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition group"
            >
              <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {section.description}
              </p>
              <div className="mt-4 text-sm font-medium text-blue-600 group-hover:translate-x-1 transition">
                Go →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-4">
            <LogOut className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Log out</h3>
              <p className="text-sm text-red-800 mt-1">
                Sign out from your account
              </p>
              <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                Log out from this device
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
