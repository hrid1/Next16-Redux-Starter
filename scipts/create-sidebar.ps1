$folderPath = "$PSScriptRoot/Sidebar"; if (-not (Test-Path $folderPath)) { New-Item -ItemType Directory -Path $folderPath -Force }; $files = @{ "index.tsx" = @"
'use client';

import React, { useEffect, useState } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarMenu from './SidebarMenu';

type SidebarVariant = 'basic' | 'collapsible';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: SidebarVariant;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  open, 
  onClose, 
  variant = 'basic'
}) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (variant === 'basic') setCollapsed(false);
  }, [variant]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isCollapsible = variant === 'collapsible';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-gray-100 flex flex-col
          border-r border-gray-200 h-full
          transform transition-all duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsible && collapsed ? 'w-16' : 'w-64'}
          md:relative md:translate-x-0 md:z-auto
        `}
      >
        <SidebarHeader
          collapsed={isCollapsible && collapsed}
          showCollapseButton={isCollapsible}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden h-full">
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
"@; "SidebarHeader.tsx" = @"
'use client';

import { ChevronLeft } from 'lucide-react';

interface SidebarHeaderProps {
  collapsed: boolean;
  showCollapseButton: boolean;
  onToggleCollapse: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  collapsed,
  showCollapseButton,
  onToggleCollapse,
}) => {
  return (
    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
      {!collapsed && (
        <span className="text-xl font-bold text-gray-800 truncate">
          Dashboard
        </span>
      )}

      {showCollapseButton && (
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-gray-200 transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 hidden md:block ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;
"@; "SidebarItem.tsx" = @"
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface ChildItem {
  label: string;
  href: string;
}

interface SidebarItemProps {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  isBottom?: boolean;
  isCollapsible?: boolean;
  children?: ChildItem[];
  collapsed?: boolean;
  onRequestExpand?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  href,
  onClick,
  icon,
  isCollapsible,
  children,
  collapsed,
  onRequestExpand,
}) => {
  const pathname = usePathname();
  const isActive = href ? pathname === href : false;
  const isChildActive = children?.some((child) => pathname === child.href);
  const [open, setOpen] = useState(isChildActive ?? false);

  const baseClass = `
    flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm
    transition-colors duration-150 cursor-pointer
    ${collapsed ? 'justify-center px-2' : ''}
    ${isActive || isChildActive
      ? 'bg-gray-900 text-white font-medium'
      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
    }
  `;

  if (collapsed) {
    if (isCollapsible && children?.length && !href) {
      return (
        <button
          type="button"
          onClick={() => {
            onRequestExpand?.();
            setOpen(true);
          }}
          className={baseClass}
          title={label}
        >
          {icon && <span className="shrink-0">{icon}</span>}
        </button>
      );
    }

    const El = href ? Link : 'button';
    return (
      <El
        href={href as string}
        onClick={onClick}
        className={baseClass}
        title={label}
      >
        {icon && <span className="shrink-0">{icon}</span>}
      </El>
    );
  }

  if (isCollapsible && children) {
    return (
      <div>
        <button onClick={() => setOpen((prev) => !prev)} className={baseClass}>
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="flex-1">{label}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="ml-6 flex flex-col relative">
            <div className="absolute left-0 top-0 bottom-6 w-px bg-gray-600 h-[calc(100%-2rem)]" />
            {children.map((child) => (
              <ChildItem
                key={child.label}
                label={child.label}
                href={child.href}
                isActive={pathname === child.href}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClass}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

const ChildItem: React.FC<{ label: string; href: string; isActive: boolean }> = ({ label, href, isActive }) => {
  return (
    <Link
      href={href}
      className={`
        relative flex items-center py-2 pl-6 text-sm transition-colors duration-150
        ${isActive ? 'text-gray-800 font-semibold' : 'text-gray-600 hover:text-gray-800'}
        before:absolute before:left-0 before:top-1/3
        before:-translate-y-1/2 before:w-5 before:h-4
        before:border-l before:border-b before:border-gray-600
        before:rounded-bl-md
      `}
    >
      {label}
    </Link>
  );
};

export default SidebarItem;
"@; "SidebarMenu.tsx" = @"
'use client';

import React from 'react';
import { Home, Store, Settings, LogOut, User } from 'lucide-react';
import SidebarItem from './SidebarItem';
import useAuth from '@/hooks/useAuth';

interface SidebarMenuProps {
  collapsed: boolean;
  onRequestExpand?: () => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ collapsed, onRequestExpand }) => {
  const { logout } = useAuth();

  const menuItems = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: <Home size={18} />,
    },
    {
      label: 'Vendors',
      icon: <Store size={18} />,
      isCollapsible: true,
      children: [
        { label: 'All Vendors', href: '/vendors' },
        { label: 'Add Vendor', href: '/vendors/add' },
        { label: 'Pending', href: '/vendors/pending' },
      ],
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings size={18} />,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <User size={18} />,
      isBottom: true,
    },
    {
      label: 'Logout',
      onClick: logout,
      icon: <LogOut size={18} />,
      isBottom: true,
    },
  ];

  const topItems = menuItems.filter((item) => !item.isBottom);
  const bottomItems = menuItems.filter((item) => item.isBottom);

  return (
    <nav className="flex flex-col px-3 py-4 justify-between h-full">
      <div className="flex flex-col gap-1">
        {topItems.map((item) => (
          <SidebarItem
            key={item.label}
            {...item}
            collapsed={collapsed}
            onRequestExpand={onRequestExpand}
          />
        ))}
      </div>
      <div className="border-t border-gray-200 pt-4 -mx-3">
        <div className="px-3 flex flex-col gap-1">
          {bottomItems.map((item) => (
            <SidebarItem
              key={item.label}
              {...item}
              collapsed={collapsed}
              onRequestExpand={onRequestExpand}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default SidebarMenu;
"@ }; foreach ($file in $files.Keys) { $path = Join-Path $folderPath $file; $files[$file] | Set-Content -Path $path -Force; Write-Host "Created: $file" }; Write-Host "`n✅ Sidebar components created successfully in: $folderPath"