import React from "react";
import { ChevronLeft } from "lucide-react";

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
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
      {!collapsed && (
        <span className="truncate text-xl font-bold text-gray-800">
          Dashboard
        </span>
      )}

      {showCollapseButton && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="ml-auto rounded-md p-1.5 transition-colors hover:bg-gray-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={18}
            className={`hidden transition-transform duration-300 md:block ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;