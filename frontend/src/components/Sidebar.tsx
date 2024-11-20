import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MdOutlineInventory } from "react-icons/md";
import { FaSignOutAlt, FaUserPlus } from "react-icons/fa";
import { BiSolidFileExport } from "react-icons/bi";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { IoMdPeople, IoMdHelpBuoy } from "react-icons/io";
import { GrTransaction } from "react-icons/gr";
import { TbCategoryPlus } from "react-icons/tb";
import { AiOutlineCaretDown, AiOutlineSetting } from "react-icons/ai";

interface SidebarProps {
  isOpen: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate();
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div
      className={`fixed z-10 top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-gray-100 text-gray-900 flex flex-col shadow-md transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <nav className="flex flex-col flex-grow mt-4">
        <NavItem to="/dashboard" icon={<MdOutlineSpaceDashboard />} label="Dashboard" />
        <NavItem to="/consumables" icon={<MdOutlineInventory />} label="Add Consumables" />
        <NavItem to="/out" icon={<FaSignOutAlt />} label="Issue Consumable" />
        <NavItem to="/history" icon={<GrTransaction />} label="Transaction History" />
        <div className="relative mx-3 mb-2">
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center justify-between w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            <div className="flex items-center">
              <AiOutlineSetting className="text-xl mr-3" />
              <span className="text-lg font-semibold">Admin</span>
            </div>
            <AiOutlineCaretDown
              className={`transition-transform ${isAdminOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isAdminOpen && (
            <div className="absolute top-full left-0 w-full bg-gray-100 shadow-lg rounded-lg mt-1 overflow-hidden">
              <NavItem to="/vendors" icon={<FaUserPlus />} label="Add Vendor" />
              <NavItem to="/people" icon={<IoMdPeople />} label="Add User" />
              <NavItem to="/category" icon={<TbCategoryPlus />} label="Add Category" />
              <NavItem to="/report" icon={<BiSolidFileExport />} label=" Generate Report" />
            </div>
          )}
        </div>
      </nav>
      <div className="px-4 py-3 border-t border-gray-300">
        <NavItem to="/help" icon={<IoMdHelpBuoy />} label=" Help" />
        <button
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg transition"
  >
    <span className="mr-3">{icon}</span>
    <span className="text-lg font-semibold">{label}</span>
  </Link>
);

export default SidebarComponent;
