"use client";

import {
  ChevronRight,
  CircleGauge,
  FileText,
  ScrollText,
  User,
  Users,
  Image,
  ImagePlus,
  LayoutList,
  Package,
  Percent,
  Settings,
  ShoppingCart,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfigContext } from "@/contexts/config";

const menus = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: CircleGauge,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Assets",
    url: "/dashboard/assets",
    icon: ImagePlus,
  },
  {
    title: "Categories",
    url: "/dashboard/categories",
    icon: LayoutList,
  },
  {
    title: "Products",
    url: "/dashboard/products",
    icon: Package,
    isActive: true,
    items: [
      {
        title: "List",
        url: "/dashboard/products",
      },
      {
        title: "Create",
        url: "/dashboard/products/create",
      },
    ],
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: ShoppingCart,
    // items: [
    //   {
    //     title: "List",
    //     url: "/dashboard/orders",
    //   },
    //   {
    //     title: "Create",
    //     url: "/dashboard/orders/create",
    //   },
    // ],
  },
  {
    title: "Invoices",
    url: "/dashboard/invoices",
    icon: FileText,
  },
  {
    title: "Coupons",
    url: "/dashboard/coupons",
    icon: Percent,
  },
  {
    title: "Banners",
    url: "/dashboard/banners",
    icon: Image,
  },
  {
    title: "Pages",
    url: "/dashboard/pages",
    icon: ScrollText,
  },
  {
    title: "Users",
    url: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { config } = useConfigContext();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <span className="text-base font-semibold">
                  {config?.siteName || "DesignBookBD"}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menus.map((item) => {
              const isActive = pathname.startsWith(item.url);
              return item?.items ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={isActive}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
