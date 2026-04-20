import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserManagement } from '../libs/shared/contexts/UserManagementContext/UserManagementContext';
import { applications } from '../Applications';
import type { User } from '../libs/shared/utils/userRolesStorage';
import './UserManagementPage.css';

const ALL_ROLES = [...new Set(applications.flatMap((app) => app.accessRoles))].sort();

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

const emptyForm = (): FormData => ({ firstName: '', lastName: '', email: '', roles: [] });

const toFormData = (user: User): FormData => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  roles: [...user.roles],
});

interface RolePickerProps {
  selected: string[];
  onChange: (roles: string[]) => void;
}

const RolePicker = ({ selected, onChange }: RolePickerProps) => {
  const [open, setOpen] = useState(false);

  const toggle = (role: string) => {
    onChange(
      selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role],
    );
  };

  return (
    <div className="role-picker">
      <button type="button" className="role-picker__toggle" onClick={() => setOpen((o) => !o)}>
        {selected.length === 0 ? 'No roles assigned' : `${selected.length} role(s) selected`}
        <span className="role-picker__chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="role-picker__dropdown">
          {ALL_ROLES.map((role) => (
            <label key={role} className="role-picker__option">
              <input type="checkbox" checked={selected.includes(role)} onChange={() => toggle(role)} />
              <span className="role-picker__label">{role}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

interface UserFormProps {
  initial?: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  title: string;
}

const UserForm = ({ initial, onSave, onCancel, title }: UserFormProps) => {
  const [form, setForm] = useState<FormData>(initial ?? emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const setField =
    (field: keyof Omit<FormData, 'roles'>) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  return (
    <div className="user-form-card">
      <h3 className="user-form-card__title">{title}</h3>
      <form className="user-form" onSubmit={handleSubmit}>
        <div className="user-form__row">
          <div className="user-form__field">
            <label className="user-form__label">First Name</label>
            <input
              className={`user-form__input${errors.firstName ? ' user-form__input--error' : ''}`}
              value={form.firstName}
              onChange={setField('firstName')}
              placeholder="First name"
            />
            {errors.firstName && <span className="user-form__error">{errors.firstName}</span>}
          </div>
          <div className="user-form__field">
            <label className="user-form__label">Last Name</label>
            <input
              className={`user-form__input${errors.lastName ? ' user-form__input--error' : ''}`}
              value={form.lastName}
              onChange={setField('lastName')}
              placeholder="Last name"
            />
            {errors.lastName && <span className="user-form__error">{errors.lastName}</span>}
          </div>
        </div>
        <div className="user-form__field">
          <label className="user-form__label">Email</label>
          <input
            type="email"
            className={`user-form__input${errors.email ? ' user-form__input--error' : ''}`}
            value={form.email}
            onChange={setField('email')}
            placeholder="user@example.com"
          />
          {errors.email && <span className="user-form__error">{errors.email}</span>}
        </div>
        <div className="user-form__field">
          <label className="user-form__label">Roles</label>
          <RolePicker selected={form.roles} onChange={(roles) => setForm((f) => ({ ...f, roles }))} />
        </div>
        <div className="user-form__actions">
          <button type="submit" className="btn btn--primary">Save</button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({ message, onConfirm, onCancel }: ConfirmDialogProps) => (
  <div className="confirm-overlay" role="dialog" aria-modal="true">
    <div className="confirm-dialog">
      <p className="confirm-dialog__message">{message}</p>
      <div className="confirm-dialog__actions">
        <button type="button" className="btn btn--danger" onClick={onConfirm}>Delete</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  </div>
);

const UserManagementPage = () => {
  const { users, loading, addUser, updateUser, deleteUser } = useUserManagement();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const handleAdd = (data: FormData) => {
    addUser(data);
    setShowAddForm(false);
    invalidateUser();
  };

  const handleUpdate = (id: string) => (data: FormData) => {
    updateUser(id, data);
    setEditingId(null);
    invalidateUser();
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteUser(deleteId);
    setDeleteId(null);
    invalidateUser();
  };

  if (loading) {
    return (
      <div className="user-mgmt">
        <p className="user-mgmt__loading">Loading users…</p>
      </div>
    );
  }

  return (
    <div className="user-mgmt">
      <div className="user-mgmt__header">
        <h1 className="user-mgmt__title">User & Role Management</h1>
        {!showAddForm && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
          >
            + Add User
          </button>
        )}
      </div>

      {showAddForm && (
        <UserForm
          title="Add New User"
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {users.length === 0 ? (
        <p className="user-mgmt__empty">No users yet. Add one above.</p>
      ) : (
        <div className="user-mgmt__table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th className="user-table__th">Name</th>
                <th className="user-table__th">Email</th>
                <th className="user-table__th">Roles</th>
                <th className="user-table__th user-table__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) =>
                editingId === user.id ? (
                  <tr key={user.id}>
                    <td colSpan={4} className="user-table__td user-table__td--form">
                      <UserForm
                        title={`Edit ${user.firstName} ${user.lastName}`}
                        initial={toFormData(user)}
                        onSave={handleUpdate(user.id)}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={user.id} className="user-table__row">
                    <td className="user-table__td user-table__td--name">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="user-table__td user-table__td--email">{user.email}</td>
                    <td className="user-table__td user-table__td--roles">
                      {user.roles.length === 0 ? (
                        <span className="user-table__no-roles">No roles</span>
                      ) : (
                        <div className="user-table__role-list">
                          {user.roles.map((role) => (
                            <span key={role} className="role-badge">{role}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="user-table__td user-table__td--actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          setEditingId(user.id);
                          setShowAddForm(false);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger-outline btn--sm"
                        onClick={() => setDeleteId(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          message={`Delete user "${users.find((u) => u.id === deleteId)?.firstName} ${users.find((u) => u.id === deleteId)?.lastName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
