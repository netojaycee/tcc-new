"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ChevronRight,
} from "lucide-react";
import {
  contactInfoItems,
  customerServiceLinks,
  helpSupportLinks,
} from "@/lib/constants/footerLinks";
import Logo from "../Logo";

export default function DesktopFooter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed with email:", email);
    setEmail("");
  };

  return (
    <footer className="bg-white text-gray-900">
      {/* Top Section */}
      <div className="px-4 md:px-16 py-12 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div>
            <Logo />
            <p className="text-sm text-gray-600 mt-4">
             Crafted on demand with quality you can trust...
            </p>
          </div>
          {/* Help & Support */}
          <div>
            <h3 className="text-base font-semibold uppercase mb-4">
              Help & Support
            </h3>
            <ul className="space-y-2">
              {helpSupportLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-700 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-base font-semibold uppercase mb-4">
              Customer Service
            </h3>
            <ul className="space-y-2">
              {customerServiceLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-700 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base font-semibold uppercase mb-4">
              Contact Info
            </h3>
            <ul className="space-y-2">
              {contactInfoItems.map((item, index) => (
                <li key={index} className="text-sm text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-4 md:px-16 py-8 border-b border-gray-200">
        <div className="flex items-center justify-between gap-8">
          {/* Newsletter */}
          <div className="flex-1 max-w-md">
            <h3 className="text-sm font-semibold mb-4 text-gray-900">
              Subscribe to our newsletter & get 10% discount
            </h3>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50 text-gray-900 border-gray-300 flex-1"
                required
              />
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 px-4"
              >
                Submit
              </Button>
            </form>
          </div>

          {/* Follow Us */}
          <div className="">
            <p className="text-sm font-semibold mb-3 text-gray-900">
              FOLLOW US:
            </p>
            <div className="flex gap-3 justify-end">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 text-gray-700 hover:text-primary transition-colors" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6 text-gray-700 hover:text-primary transition-colors" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6 text-gray-700 hover:text-primary transition-colors" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6 text-gray-700 hover:text-primary transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Copyright */}
      <div className="px-4 md:px-16 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold mb-3 text-gray-900">
              Secure shopping
            </p>
            <div className="flex flex-wrap gap-2">
              <Image
                src="/visa.png"
                alt="Visa"
                width={48}
                height={30}
                className="bg-white rounded p-1 border border-gray-200"
              />
              <Image
                src="/amazon.png"
                alt="Amazon pay"
                width={48}
                height={30}
                className="bg-white rounded p-1 border border-gray-200"
              />
              <Image
                src="/paypal.png"
                alt="PayPal"
                width={48}
                height={30}
                className="bg-white rounded p-1 border border-gray-200"
              />
              <Image
                src="/mastercard.png"
                alt="Mastercard"
                width={48}
                height={30}
                className="bg-white rounded p-1 border border-gray-200"
              />
            </div>
          </div>
          {/* Copyright */}
          <div className="">
            <p className="text-xs text-gray-500">
              Copyright © 2025 thecertifiedchristian | All Rights Reserved{" "}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
