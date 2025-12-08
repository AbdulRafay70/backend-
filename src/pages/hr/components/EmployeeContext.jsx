import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../../../utils/Api';

const EmployeeContext = createContext(null);

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/hr/employees/');
      const data = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
      setEmployees(data || []);
    } catch (e) {
      console.warn('EmployeeProvider fetch failed', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  return (
    <EmployeeContext.Provider value={{ employees, loading, refresh: fetchEmployees }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployees = () => {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error('useEmployees must be used inside EmployeeProvider');
  return ctx;
};

export default EmployeeProvider;
