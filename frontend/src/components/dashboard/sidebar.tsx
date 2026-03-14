"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  CreditCard,
  ClipboardList,
  CheckSquare,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parents", label: "Phụ huynh", icon: Users },
  { href: "/students", label: "Học sinh", icon: GraduationCap },
  { href: "/classes", label: "Lớp học", icon: CalendarDays },
  { href: "/subscriptions", label: "Gói học", icon: CreditCard },
  { href: "/registrations", label: "Đăng ký lớp", icon: ClipboardList },
  { href: "/attendance", label: "Điểm danh", icon: CheckSquare },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 rounded-lg border bg-white p-2 shadow-sm lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b px-5">
          {/* <Image
            src="/logo/favicon.jpeg"
            alt="TeenCare"
            width={36}
            height={36}
            className="rounded-lg"
          /> */}
          <Image
            src="/logo/logo.png"
            alt="TeenCare"
            width={120}
            height={30}
            className="h-7 w-auto"
          />
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {nav}
        </div>

        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">TeenCare LMS v1.0</p>
        </div>
      </aside>
    </>
  );
};
