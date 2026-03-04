"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

export default function AccountSecurityPage() {
  const [activeTab, setActiveTab] = useState<"password" | "2fa" | "devices">(
    "password"
  );

  /* Password Change */
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveClicked, setSaveClicked] = useState(false);

  /* 2FA */
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode] = useState("z5Zerdhfdiww_63hbjkd");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const passwordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    const levels = [
      { strength: 0, label: "", color: "" },
      { strength: 1, label: "Weak", color: "bg-red-500" },
      { strength: 2, label: "Fair", color: "bg-orange-500" },
      { strength: 3, label: "Good", color: "bg-yellow-500" },
      { strength: 4, label: "Strong", color: "bg-green-500" },
    ];
    return levels[Math.min(strength, 4)];
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Security</h2>
        <p className="text-gray-600 mt-1">
          Manage your password and security settings
        </p>
      </div>

      {/* Tabs - Mobile */}
      <div className="lg:hidden flex gap-2 border-b border-gray-200 -mx-6 px-4 overflow-x-auto">
        {["password", "2fa", "devices"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "password" | "2fa" | "devices")}
            className={`pb-2 px-2 whitespace-nowrap text-sm font-medium transition border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "password"
              ? "Password"
              : tab === "2fa"
                ? "2FA"
                : "Devices"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Change Password */}
        {activeTab === "password" && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Change Password
            </h3>

            {/* Old Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Old password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10"
                  placeholder="Enter your current password"
                />
                <button
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showOldPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10"
                  placeholder="Set new password"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength */}
              {newPassword && (
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all`}
                      style={{ width: `${(strength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Your new password must differ from old password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setSaveClicked(true)}
                className="flex-1 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* 2FA */}
        {activeTab === "2fa" && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Two-Factor Authentication
            </h3>

            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">
                  2 factor authentication
                </p>
                <p className="text-sm text-gray-600">
                  Activate 2FA for extra security
                </p>
              </div>
              <button
                onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                  twoFAEnabled ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    twoFAEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* QR Code Section */}
            {twoFAEnabled && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Scan the QR code
                  </p>
                  <p className="text-xs text-gray-600 mb-4">
                    Scan the code to enable two-factor authentication on your
                    device
                  </p>

                  {showQR ? (
                    <div className="bg-white p-4 rounded-lg border border-gray-300 w-fit">
                      <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-4xl">📱</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowQR(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Show QR Code
                    </button>
                  )}
                </div>

                {/* OR Divider */}
                {showQR && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-300" />
                      <span className="text-sm text-gray-600">or</span>
                      <div className="flex-1 h-px bg-gray-300" />
                    </div>

                    {/* Manual Entry */}
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Or enter this code manually
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-300 font-mono">
                        <code className="flex-1 text-sm break-all">
                          {qrCode}
                        </code>
                        <button
                          onClick={handleCopy}
                          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded transition"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Devices */}
        {activeTab === "devices" && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Devices
            </h3>

            <div className="space-y-3">
              {[
                {
                  name: "Chrome on Windows",
                  lastActive: "Just now",
                  isCurrent: true,
                },
                {
                  name: "Safari on iPhone",
                  lastActive: "2 days ago",
                  isCurrent: false,
                },
              ].map((device, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{device.name}</p>
                    <p className="text-sm text-gray-600">
                      Last active: {device.lastActive}
                    </p>
                  </div>
                  {device.isCurrent && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Current device
                    </span>
                  )}
                  {!device.isCurrent && (
                    <button className="text-sm font-medium text-red-600 hover:text-red-700 transition">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
