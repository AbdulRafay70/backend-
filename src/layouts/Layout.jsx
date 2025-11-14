import React from 'react';
import { Navbar } from "../components/Navbar";
import Sidebar from '../components/Sidebar';

const Layout = ({ children }) => {
  return (
    <>
      <main className="container">{children}</main>
    </>
  );
};

export default Layout;