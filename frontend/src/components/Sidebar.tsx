import { HiChartPie } from "react-icons/hi";
import { IoCashOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { MdOutlineInventory } from "react-icons/md";
import { FaSignOutAlt } from "react-icons/fa"; // Import new icon for OUT page

interface SidebarProps {
  isOpen: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div
      className={`fixed z-10 top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-gray-100 text-gray-900 flex flex-col shadow-md transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <nav className="flex flex-col flex-grow mt-4">
        <NavItem href="/consumables" icon={<MdOutlineInventory />} label="Add Consumables" />
        <NavItem href="/out" icon={<FaSignOutAlt />} label="Claim Consumable" /> {/* Add new link for OUT */}
        <NavItem href="/history" icon={<MdOutlineInventory />} label="Transaction History" />
      </nav>
      <div className="px-4 py-3 border-t border-gray-300">
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

const NavItem: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => (
  <a
    href={href}
    className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
  >
    <span className="mr-3">{icon}</span>
    <span className="text-lg font-semibold">{label}</span>
  </a>
);

export default SidebarComponent;
