"use client";

import { useTransition, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SheetClose } from "@/components/ui/sheet";
import { Search, Loader2, ShoppingBag, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logoutAction } from "@/lib/actions/auth.actions";
import { useSearch } from "@/lib/hooks/useSearch";
import Logo from "../Logo";

interface MobileNavContentProps {
  user: any;
  categories: any[];
}

export default function MobileNavContent({
  user,
  categories,
}: MobileNavContentProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { results, isLoading } = useSearch(searchQuery);
  const closeSheetRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        await logoutAction();
        // Close sheet after logout
        closeSheetRef.current?.click();
      } catch (error) {
        console.error("Logout error:", error);
      }
    });
  };

  const handleSearchResultClick = (name?: string) => {
    const searchTerm = name || searchQuery;
    console.log("✓ Search result clicked:", searchTerm);
    console.log("✓ Navigating to /products?search=" + searchTerm);
    router.push(`/products?search=${encodeURIComponent(searchTerm)}`);
    setSearchQuery("");
    setShowSearchResults(false);
    closeSheetRef.current?.click();
  };

  const accountLinks = [
    { label: "Orders", href: "/orders" },
    { label: "Recently Viewed", href: "/recently-viewed" },
    { label: "Account management", href: "/account-management" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Logo />
      {/* Search Bar */}
      <div className="mb-6 mt-3">
        <div className="relative">
          <Input
            placeholder="Search for anything..."
            className="pl-10 pr-3 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => searchQuery && setShowSearchResults(true)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 p-4 text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Searching...</span>
                </div>
              )}

              {!isLoading && (!results?.length) && (
                <div className="p-4 text-center text-gray-500 text-xs">
                  No results found
                </div>
              )}

              {/* Products */}
              {!isLoading && results && results.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-3 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-600 uppercase">
                      Products
                    </p>
                  </div>
                  {results.map((prod: any) => (
                    <button
                      key={prod.id}
                      onClick={() => handleSearchResultClick(prod.name)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-800"
                    >
                      {prod.name}
                    </button>
                  ))}
                </div>
              )}

              {/* View All Results */}
              {!isLoading && results && results.length > 0 && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <button
                    onClick={() => handleSearchResultClick()}
                    className="w-full text-sm text-primary font-medium hover:underline py-1"
                  >
                    View all results for &quot;{searchQuery}&quot;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* My Account Section */}
        {user && (
          <div className="mb-8 border border-gray-300 rounded">
            <div className="bg-gray-100 px-3 py-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              <p className="text-sm font-bold uppercase text-gray-700">
                My Account
              </p>
            </div>
            <ul className="">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <SheetClose asChild>
                    <Link
                      href={link.href}
                      className="block text-sm font-normal text-gray-800 hover:text-primary transition-colors px-3 py-3 underline"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Shop Section */}
        <div className="mb-8 border border-gray-300 rounded">
          <div className="bg-gray-100 px-3 py-2 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <p className="text-sm font-bold uppercase text-gray-700">Shop</p>
          </div>
          <ul className="">
            {/* Gift Packages Link */}
            <li>
              <SheetClose asChild>
                <Link
                  href="/category/giftbox"
                  className="block text-sm font-normal text-gray-800 hover:text-primary transition-colors px-3 py-3 underline"
                >
                  Gift Packages
                </Link>
              </SheetClose>
            </li>
            {/* Dynamic Category Links */}
            {categories.map((category: any) => (
              <li key={category.id}>
                <SheetClose asChild>
                  <Link
                    href={`/products/${category.slug}`}
                    className="block text-sm font-normal text-gray-800 hover:text-primary transition-colors px-3 py-3 underline"
                  >
                    {category.name || category.title}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 pt-4 space-y-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="px-2 py-3">
              <p className="text-xs font-semibold">
                {user?.firstName || "John"} {user?.lastName || "Doe"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || "john.doe@example.com"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
            {/* Hidden SheetClose to programmatically close sheet on logout */}
            <SheetClose ref={closeSheetRef} className="hidden" />
          </div>
        ) : (
          <>
            <SheetClose asChild>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/auth/login">Get Started</Link>
              </Button>
            </SheetClose>
          </>
        )}
      </div>
    </div>
  );
}
