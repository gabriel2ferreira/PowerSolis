import React from 'react';
import Layout from '@/components/Layout';
import DashboardNavigation from './DashboardNavigation';

const DashboardLayout = ({ children }) => {
  return (
    <Layout showHeader={true}>
      <div className="flex flex-col space-y-4 -mt-4 md:-mt-6 mx-[-1rem] md:mx-[-1.5rem]">
        <div className="px-4 md:px-6 pt-4 md:pt-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Dashboard Analytics</h1>
        </div>
        <DashboardNavigation />
        <div className="px-4 md:px-6 py-4">
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardLayout;