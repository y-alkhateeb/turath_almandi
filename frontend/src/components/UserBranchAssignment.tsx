import { useState, useEffect } from 'react';
import { usersService } from '@services/users.service';
import { branchesService } from '@services/branches.service';
import type { User } from '@/types/auth.types';
import type { Branch } from '@/types/branches.types';
import { ConditionalRender } from './ConditionalRender';

export const UserBranchAssignment = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, branchesData] = await Promise.all([
        usersService.getAll(),
        branchesService.getAll(),
      ]);
      setUsers(usersData);
      setBranches(branchesData);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBranch = async (userId: string, branchId: string | null) => {
    try {
      setSaving(userId);
      const updatedUser = await usersService.assignBranch(userId, branchId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );
    } catch (err) {
      console.error('Error assigning branch:', err);
      alert('Failed to assign branch');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ConditionalRender roles={['ADMIN']}>
      <div className="p-6 bg-[var(--bg-secondary)] rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">User Branch Assignment</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Current Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Assign Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-color)]">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    <span
                      className={`px-2 py-1 rounded ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    {user.branch?.name || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    <select
                      value={user.branchId || ''}
                      onChange={(e) =>
                        handleAssignBranch(user.id, e.target.value || null)
                      }
                      disabled={saving === user.id}
                      className="px-3 py-1 border border-[var(--border-color)] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-[var(--bg-tertiary)]"
                    >
                      <option value="">No Branch</option>
                      {branches
                        .filter((b) => b.isActive)
                        .map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    {saving === user.id ? (
                      <span className="text-blue-600">Saving...</span>
                    ) : (
                      <span
                        className={
                          user.isActive ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ConditionalRender>
  );
};
