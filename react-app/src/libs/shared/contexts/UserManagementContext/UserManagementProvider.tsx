import { useState, useCallback, useEffect, type ReactNode } from 'react';
import UserManagementContext from './UserManagementContext';
import {
  fetchInitialUsers,
  loadUsers,
  saveUsers,
  type User,
} from '../../utils/userRolesStorage';

export const UserManagementProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => loadUsers() ?? []);
  const [loading, setLoading] = useState(() => loadUsers() === null);

  useEffect(() => {
    if (!loading) return;
    fetchInitialUsers().then((initial) => {
      setUsers(initial);
      setLoading(false);
    });
  }, [loading]);

  const persist = useCallback((next: User[]) => {
    saveUsers(next);
    setUsers(next);
  }, []);

  const addUser = useCallback(
    (data: Omit<User, 'id'>) => {
      persist([...users, { ...data, id: crypto.randomUUID() }]);
    },
    [users, persist],
  );

  const updateUser = useCallback(
    (id: string, changes: Omit<User, 'id'>) => {
      persist(users.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    },
    [users, persist],
  );

  const deleteUser = useCallback(
    (id: string) => {
      persist(users.filter((u) => u.id !== id));
    },
    [users, persist],
  );

  return (
    <UserManagementContext.Provider value={{ users, loading, addUser, updateUser, deleteUser }}>
      {children}
    </UserManagementContext.Provider>
  );
};
