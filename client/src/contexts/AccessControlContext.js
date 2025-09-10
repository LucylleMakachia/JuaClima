import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

const AccessControlContext = createContext(null);

export const AccessControlProvider = ({ children }) => {
  const { user } = useAuth();

  // For example define roles/permissions here or fetch from API
  const permissions = useMemo(() => {
    if (!user) return [];
    if (user.isAdmin) return ["viewPrivate", "downloadPrivate", "manageUsers"];
    if (user.hasPaidPackage) return ["viewPrivate", "downloadPrivate"];
    return [];
  }, [user]);

  const canAccess = (permission) => permissions.includes(permission);

  return (
    <AccessControlContext.Provider value={{ canAccess }}>
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = () => useContext(AccessControlContext);
