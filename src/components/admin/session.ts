import { createContext, useContext } from "react";

export const AdminSessionContext = createContext<{ logout: () => void }>({ logout: () => {} });

export const useAdminSession = () => useContext(AdminSessionContext);
