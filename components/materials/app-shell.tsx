"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Menu, Search } from "lucide-react";
import { useState } from "react";
import { AuthProvider } from "@/components/accounts/auth-provider";
import { useAuth } from "@/components/accounts/auth-context";
import { AccountMenu } from "@/components/accounts/account-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="CALYPSO Materials home">
      <span className="brand-mark">
        <Box size={23} strokeWidth={1.6} />
      </span>
      <span>
        CALYPSO<span className="brand-caption">Materials Database</span>
      </span>
    </Link>
  );
}
function NavigationLinks({ close = false }: { close?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const links = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore Materials" },
    { href: "/docs", label: "Documentation" },
    { href: "/contribute", label: "Contribute" },
    { href: "/about", label: "About" },
  ];
  const renderLink = ({ href, label }: (typeof links)[number]) => {
    const link = (
      <Link
        className={pathname === href ? "nav-link active" : "nav-link"}
        href={href}
        aria-current={pathname === href ? "page" : undefined}
      >
        {label}
      </Link>
    );
    return close ? (
      <SheetClose asChild key={href}>
        {link}
      </SheetClose>
    ) : (
      <span key={href}>{link}</span>
    );
  };
  return (
    <>
      {(close
        ? [
            ...links,
            {
              href: user ? "/account" : "/login?returnTo=%2Faccount",
              label: user ? "My account" : "Sign in",
            },
            ...(!user ? [{ href: "/signup", label: "Sign up" }] : []),
            { href: "/workspace", label: "My contributions" },
            ...(user?.role === "admin"
              ? [{ href: "/admin", label: "Administration" }]
              : []),
          ]
        : links
      ).map(renderLink)}
    </>
  );
}
export function TopNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavigationLinks />
        </nav>
        <div className="header-actions">
          <Link
            href="/explore#search"
            className="icon-button"
            aria-label="Search materials"
          >
            <Search size={19} />
          </Link>
          <span className="header-separator" />
          <AccountMenu />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                className="mobile-trigger"
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
              >
                <Menu size={22} />
              </Button>
            </SheetTrigger>
            <SheetContent className="mobile-sheet">
              <SheetHeader>
                <SheetTitle>CALYPSO Materials</SheetTitle>
                <SheetDescription>
                  High-pressure materials discovery
                </SheetDescription>
              </SheetHeader>
              <nav className="mobile-nav" aria-label="Mobile navigation">
                <NavigationLinks close />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <TopNavigation />
      {children}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <Brand />
            <p>High-pressure materials. A broader perspective.</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/explore">Explore Materials</Link>
            <Link href="/about">About the Database</Link>
            <Link href="/docs">Documentation &amp; Updates</Link>
            <Link href="/contribute">Contribute Data</Link>
            <Link href="/workspace">My Contributions</Link>
            <Link href="/#team">Our Team</Link>
            <Link href="/#join-us">Contact &amp; Feedback</Link>
            <Link href="/admin">Administration</Link>
          </nav>
          <span className="footer-note">
            CALYPSO High-Pressure
            <br />
            Materials Database
          </span>
        </div>
      </footer>
    </AuthProvider>
  );
}
