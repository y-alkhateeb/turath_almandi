import { useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <Header onMenuClick={toggleSidebar} />

      {/* Main Content Area with Sidebar - Add pt-16 to account for fixed header */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
