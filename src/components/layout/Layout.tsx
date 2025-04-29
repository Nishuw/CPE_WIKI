
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  currentTopicId?: string;
}

const Layout: React.FC<LayoutProps> = ({
  currentTopicId
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex flex-1">
        {/* Sidebar positioned absolutely and controlled by state */}
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} currentTopicId={currentTopicId} />

        <main className={`flex-1 p-6 overflow-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

