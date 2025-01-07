import { FunctionComponent, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { RxHamburgerMenu, RxCross2 } from "react-icons/rx";
import SidebarComponent from "../components/Sidebar";

const Layout: FunctionComponent = () => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  const handleCloseSidebar = () => {
    setIsSideBarOpen(false);
  };

  return (
    <div className="flex flex-col w-screen h-screen">
      <SidebarComponent isOpen={isSideBarOpen} onClose={handleCloseSidebar} />
      <div className="header fixed top-0 left-0 right-0 flex w-full h-16 min-h-[64px] px-4 bg-gray-100 shadow-lg items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          {isSideBarOpen ? (
            <RxCross2
              className="hover:cursor-pointer flex-shrink-0"
              onClick={() => setIsSideBarOpen(false)}
              size={30}
            />
          ) : (
            <RxHamburgerMenu
              className="hover:cursor-pointer flex-shrink-0"
              onClick={() => setIsSideBarOpen(true)}
              size={30}
            />
          )}
          <a href="/" className="flex items-center">
            <img className="w-32 h-8 object-contain" src="/logo.jpg" alt="Company Logo" />
          </a>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 hover:shadow-md transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex w-full grow mt-16">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
