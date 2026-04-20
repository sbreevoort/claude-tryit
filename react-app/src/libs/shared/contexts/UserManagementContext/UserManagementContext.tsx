import { createContext, useContext } from 'react';
import type { User } from '../../utils/userRolesStorage';

export interface UserManagementContextType {
  users: User[];
  loading: boolean;
  addUser: (data: Omit<User, 'id'>) => void;
  updateUser: (id: string, changes: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
}

const UserManagementContext = createContext<UserManagementContextType>({
  users: [],
  loading: true,
  addUser: () => {},
  updateUser: () => {},
  deleteUser: () => {},
});

export const useUserManagement = () => useContext(UserManagementContext);

export default UserManagementContext;
