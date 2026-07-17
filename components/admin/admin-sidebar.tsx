"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Database,
  Code2,
  LogOut,
  Menu,
  X,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  const handleLogout = () => {
    setIsLogoutModalOpen(true)
  }

  const confirmLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/admin')
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const isDeveloperEmail = (email: string | null | undefined) => {
    return email === "jrsiliacay.dev@gmail.com" || email === "kyla@example.com"
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Parts Room",
      href: "/admin/parts",
      icon: Package,
    },
    {
      title: "Purchasing",
      href: "/admin/purchasing",
      icon: ShoppingCart,
    },
    {
      title: "Price List",
      href: "/admin/parts/prices",
      icon: Tag,
    },
    {
      title: "System Files",
      href: "/admin/maintenance",
      icon: Database,
    },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card text-foreground relative">
      {/* Desktop Collapse Toggle */}
      <Button
        variant="default"
        size="icon"
        className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-50 h-8 w-8 rounded-full border-2 border-background shadow-lg shadow-primary/20 hover:scale-110 transition-transform bg-primary text-primary-foreground"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* Logo Area */}
      <div className={cn("p-6 flex items-center gap-3 border-b border-border transition-all duration-300", isCollapsed && "justify-center px-0")}>
        <div className="flex items-center justify-center w-12 h-12 bg-transparent overflow-hidden select-none shrink-0">
          <img src="/autoworxlogo.png" alt="Autoworx logo" className="w-12 h-12 object-contain drop-shadow-md" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
            <span className="font-serif text-xl font-bold tracking-tight text-primary">
              AUTOWORX
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-1 font-semibold truncate">
              Admin Panel
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden hide-scrollbar">
        {!isCollapsed && (
          <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 animate-in fade-in duration-300">
            Main Menu
          </div>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(`${item.href}/`))
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)} title={isCollapsed ? item.title : undefined}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {!isCollapsed && <span className="truncate animate-in fade-in duration-300">{item.title}</span>}
              </div>
            </Link>
          )
        })}

        {/* Developer Tasks (Conditional) */}
        {!isCollapsed && (
          <div className="mt-8 mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 animate-in fade-in duration-300">
            Tools
          </div>
        )}
        <Link href="/admin/developer-tasks" onClick={() => setIsMobileOpen(false)} title={isCollapsed ? "Developer Tasks" : undefined}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group mt-2",
              isCollapsed && "justify-center px-0",
              pathname?.startsWith("/admin/developer-tasks")
                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                : "text-blue-500/70 hover:bg-blue-500/5 hover:text-blue-500"
            )}
          >
            <Code2 className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate animate-in fade-in duration-300">Developer Tasks</span>}
          </div>
        </Link>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-border bg-muted/20">
        {session?.user && (
          <div
            className={cn("flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-background border border-border/50 transition-all duration-300", isCollapsed && "justify-center px-0 bg-transparent border-transparent")}
            title={isCollapsed ? session.user.name || "Admin User" : undefined}
          >
            {session.user.image ? (
              <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-border/50 shrink-0" />
            ) : (
              <UserCircle className="w-8 h-8 text-muted-foreground shrink-0" />
            )}
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
                <span className="text-sm font-semibold truncate">{session.user.name || "Admin User"}</span>
                <span className="text-xs text-muted-foreground truncate">{session.user.email}</span>
              </div>
            )}
          </div>
        )}
        <Button
          variant="outline"
          className={cn("w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-300",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Log out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Log out</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" className="bg-card shadow-md" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen shrink-0 border-r border-border bg-card",
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          !isMobileOpen && (isCollapsed ? "lg:w-20" : "lg:w-64")
        )}
      >
        <SidebarContent />
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="bg-card border border-border shadow-2xl rounded-2xl p-6 w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 mb-4 bg-muted/30 rounded-full flex items-center justify-center p-2">
              <img src="/autoworxlogo.png" alt="Autoworx logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Ready to wrap up?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              You are about to log out of the Autoworx admin panel.
            </p>
            <p className="text-sm font-medium text-foreground mb-6">
              Thank you for your hard work today{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}!
            </p>
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmLogout}
              >
                Yes, Log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
