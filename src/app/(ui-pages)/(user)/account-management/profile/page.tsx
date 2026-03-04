"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("Samuel Edeh");
  const [email, setEmail] = useState("samuel.pst@gmail.com");
  const [phone, setPhone] = useState("+44 0000 000 000");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <p className="text-gray-600 mt-1">
          Update your personal information
        </p>
      </div>

      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
            {photo ? (
              <img
                src={photo}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl font-bold text-white">SE</div>
            )}
          </div>
          <label htmlFor="photo-upload" className="absolute bottom-0 right-0">
            <div className="bg-white border-2 border-gray-200 rounded-full p-2 cursor-pointer hover:border-blue-500 transition shadow-md">
              <Upload className="w-4 h-4 text-gray-700" />
            </div>
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
        <button
          onClick={() => setPhoto(null)}
          className="text-sm text-gray-600 hover:text-gray-900 transition"
        >
          Remove photo
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter your email"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter your phone number"
          />
          <p className="text-xs text-gray-500 mt-2">
            Include country code (e.g., +44 for UK)
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900">
          Email connected to your account
        </h3>
        <p className="text-sm text-blue-800 mt-2">
          Your email address is connected to your Stripe account. To update it,
          please contact our support team.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </div>
  );
}
