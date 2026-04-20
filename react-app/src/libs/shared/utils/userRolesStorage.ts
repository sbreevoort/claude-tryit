const STORAGE_KEY = 'userroles-data';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

interface UserRolesData {
  users: User[];
}

export const loadUsers = (): User[] | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as UserRolesData).users;
  } catch {
    return null;
  }
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ users }));
};

let initPromise: Promise<User[]> | null = null;

export const fetchInitialUsers = (): Promise<User[]> => {
  if (initPromise) return initPromise;
  const cached = loadUsers();
  if (cached) {
    initPromise = Promise.resolve(cached);
    return initPromise;
  }
  initPromise = fetch('/userroles-config.json')
    .then((r) => r.json() as Promise<UserRolesData>)
    .then((data) => {
      saveUsers(data.users);
      return data.users;
    });
  return initPromise;
};
