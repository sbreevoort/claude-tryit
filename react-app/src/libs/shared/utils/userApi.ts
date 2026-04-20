import { fetchInitialUsers, loadUsers } from './userRolesStorage';
export type { User as UserData } from './userRolesStorage';

export const fetchUser = async () => {
  const users = loadUsers() ?? (await fetchInitialUsers());
  if (!users.length) throw new Error('No users configured');
  return users[0];
};
