"use client";

import React, { useEffect, useState } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";

type SidebarVariant = "basic" | "collapsible";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: SidebarVariant;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  variant = "basic",
}) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (variant === "basic") setCollapsed(false);
  }, [variant]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isCollapsible = variant === "collapsible";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 bg-gray-100
          transform transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsible && collapsed ? "w-16" : "w-64"}
          md:relative md:z-auto md:translate-x-0
        `}
      >
        <SidebarHeader
          collapsed={isCollapsible && collapsed}
          showCollapseButton={isCollapsible}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />

        <div className="h-full flex-1 overflow-x-hidden overflow-y-auto">
          <SidebarMenu
            collapsed={isCollapsible && collapsed}
            onRequestExpand={() => setCollapsed(false)}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;