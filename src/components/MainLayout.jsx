import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChangePasswordPanel from './ChangePasswordPanel';
import ChatWidget from './rag/ChatWidget';

const MainLayout = ({ user }) => {
  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <Header user={user} onOpenChangePassword={() => setIsPasswordPanelOpen(true)} />
      <main className="flex-1 min-h-0 overflow-auto">
        <Outlet context={{ user }} />
      </main>
      <ChatWidget />
      <ChangePasswordPanel isOpen={isPasswordPanelOpen} onClose={() => setIsPasswordPanelOpen(false)} />
    </div>
  );
};

export default MainLayout;
