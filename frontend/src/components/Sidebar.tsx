import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdOutlineInventory,
  MdOutlineSpaceDashboard,
} from "react-icons/md";
import { FaSignOutAlt } from "react-icons/fa";
import { GrTransaction } from "react-icons/gr";
import { IoMdPeople, IoMdHelpBuoy } from "react-icons/io";
import { AiOutlineSetting } from "react-icons/ai";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      onClose(); // Close sidebar before navigation
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar after navigation
  };

  const mainMenuItems = [
    { path: "/dashboard", icon: <MdOutlineSpaceDashboard />, label: "Inventory" },
    { path: "/consumables", icon: <MdOutlineInventory />, label: "Add Consumable" },
    { path: "/out", icon: <FaSignOutAlt />, label: "Issue Consumable" },
    { path: "/history", icon: <GrTransaction />, label: "History" },
  ];

  const adminMenuItems = [
    { path: "/vendors", icon: <IoMdPeople />, label: "Vendors" },
    { path: "/people", icon: <IoMdPeople />, label: "Users" },
    { path: "/category", icon: <AiOutlineSetting />, label: "Categories" },
    { path: "/admin", icon: <AiOutlineSetting />, label: "Admins" },
    { path: "/report", icon: <AiOutlineSetting />, label: "Reports" },
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <div
      className={`fixed z-20 top-16 left-0 w-56 h-[calc(100vh-4rem)] bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <nav className="flex flex-col h-full">
        <div className="flex-1 py-4">
          {mainMenuItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              isActive={isCurrentPath(item.path)}
              onClick={() => handleNavigation(item.path)}
            />
          ))}

          <div className="px-4 py-2 mt-4">
            <div
              className={`text-sm font-medium text-black-400 cursor-pointer hover:text-gray-600 transition-colors ${
                isAdminOpen ? "mb-2" : ""
              }`}
              onClick={() => setIsAdminOpen(!isAdminOpen)}
            >
              Admin
            </div>
            {isAdminOpen && (
              <div className="ml-2">
                {adminMenuItems.map((item) => (
                  <NavItem
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    isActive={isCurrentPath(item.path)}
                    onClick={() => handleNavigation(item.path)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <NavItem
            to="/help"
            icon={<IoMdHelpBuoy />}
            label="Help"
            onClick={() => handleNavigation("/help")}
            isActive={isCurrentPath("/help")}
          />
          <button
            className="w-full mt-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center px-4 py-2 my-1 text-sm rounded-md cursor-pointer transition-colors duration-150 ${
      isActive
        ? "bg-gray-100 text-gray-900 font-medium"
        : "text-gray-600 hover:bg-gray-50"
    }`}
  >
    <span className="text-lg mr-3">{icon}</span>
    <span>{label}</span>
  </div>
);

export default SidebarComponent;
