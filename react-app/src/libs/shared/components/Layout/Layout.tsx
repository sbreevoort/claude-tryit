import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main-col">
        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
