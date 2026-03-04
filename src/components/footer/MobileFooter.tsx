"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import Logo from "../Logo";
import {
  contactInfoItems,
  customerServiceLinks,
  helpSupportLinks,
} from "@/lib/constants/footerLinks";

export default function MobileFooter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed with email:", email);
    setEmail("");
  };

  return (
    <footer className="bg-white text-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Logo */}

        {/* Accordions Section */}
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem
            value="help-support"
            className="border-b border-gray-200"
          >
            <AccordionTrigger className="text-base font-semibold uppercase py-4 text-gray-900 hover:text-primary transition-colors">
              Help & Support
            </AccordionTrigger>
            <AccordionContent className="pb-4">
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="customer-service"
            className="border-b border-gray-200"
          >
            <AccordionTrigger className="text-base font-semibold uppercase py-4 text-gray-900 hover:text-primary transition-colors">
              Customer Service
            </AccordionTrigger>
            <AccordionContent className="pb-4">
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="contact-info"
            className="border-b border-gray-200"
          >
            <AccordionTrigger className="text-base font-semibold uppercase py-4 text-gray-900 hover:text-primary transition-colors">
              Contact Info
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ul className="space-y-2">
                {contactInfoItems.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Follow Us Section */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <p className="text-sm font-semibold uppercase mb-3 text-gray-900">
            Follow Us:
          </p>
          <div className="flex gap-4">
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

        {/* Newsletter Section */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h3 className="text-base font-bold mb-4 text-gray-900">
            Subscribe to our newsletter & get 10% discount
          </h3>
          <form onSubmit={handleSubmit} className="gap-2 flex">
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

        {/* Secure Shopping */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <p className="text-sm font-semibold uppercase mb-3 text-gray-900">
            Secure shopping
          </p>
          <div className="flex gap-2">
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
        <div className="mb-3">
          <p className="text-xs text-gray-500">
            Copyright © 2025 thecertifiedchristian | All Rights Reserved{" "}
          </p>
        </div>

        <div className="mb-2">
          <Logo />

          <p className="text-sm text-gray-600 mt-2">
            Crafted on demand with quality you can trust...
          </p>
        </div>
      </div>
    </footer>
  );
}
