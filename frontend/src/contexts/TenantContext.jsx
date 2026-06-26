import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // In a real app, we'd fetch the user and their tenant from /api/auth/me
    const fetchUser = async () => {
      try {
        // Mocking the API call for now
        // const response = await fetch('/api/auth/me');
        // const data = await response.json();
        
        // Mock data
        const mockData = {
          user: { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'owner' },
          tenant: { id: 't1', name: 'Clínica Sorriso', slug: 'clinica-sorriso', plan: 'pro' }
        };
        
        setTimeout(() => {
          setUser(mockData.user);
          setTenant(mockData.tenant);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching auth data:', error);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, user, loading, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
