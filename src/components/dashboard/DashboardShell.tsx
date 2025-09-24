"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  PlaySquare,
  ImageIcon,
  Film,
  CheckCircle2,
  Wallet,
  Users,
  Mic,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Video Ideas", href: "/dashboard/ideas", icon: PlaySquare },
  {
    label: "Thumbnail Generator",
    href: "/dashboard/thumbnails",
    icon: ImageIcon,
  },
  { label: "Reels Maker", href: "/dashboard/reels", icon: Film },
  { label: "Similar Channels", href: "/dashboard/similar", icon: Users },
  { label: "Audio Generator", href: "/dashboard/audio", icon: Mic },
  { label: "CTR Predictor", href: "/dashboard/ctr", icon: CheckCircle2 },
  { label: "Recharge", href: "/dashboard/recharge", icon: Wallet },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setCredits(data?.user?.credits ?? null);
      } catch {
        // swallow; UI remains without credits
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => navItems, []);

  return (
    <SidebarProvider>
      <Sidebar className="bg-white border-r">
        <SidebarHeader className="px-4 py-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              width={200}
              height={40}
              alt="Thryve"
              priority
            />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t px-4 py-2 text-xs text-black/60">
          © {new Date().getFullYear()} Thryve
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 border-b bg-white/70 backdrop-blur">
          <div className="mx-10 flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <span className="md:hidden inline-flex items-center">
                <Image src="/logo.png" width={120} height={32} alt="Thryve" />
              </span>
            </div>

            <div className="flex items-center gap-3">
              {typeof credits === "number" ? (
                <Badge className="bg-primary text-white rounded-full px-3 py-1">
                  Credits: {credits}
                </Badge>
              ) : null}
              <UserButton />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-10 my-5">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashboardShell;
