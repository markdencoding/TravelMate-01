'use client';

import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { AdminUserRecord } from '../types';

export const AdminScreen: React.FC = () => {
  const { adminUsers, updateAdminUserRole, deleteAdminUser } = useTravelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [featureToggles, setFeatureToggles] = useState({
    pacingAdvisor: true,
    fxSync: true,
    offlineMaps: true,
    strictAuditing: false,
  });

  // Filtered users
  const filteredUsers = adminUsers.filter((u) => {
    if (roleFilter !== 'all' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (
      searchQuery &&
      !u.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !u.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Home</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-semibold">Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Admin Console & Team Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage expedition teammates, role-based access permissions, and atelier feature flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Invite Teammate
          </button>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Curators</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display mt-1">
            {adminUsers.length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-[12px]">check_circle</span>
            All verified accounts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Sessions</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display mt-1">3</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-[12px]">devices</span>
            Web SPA &amp; Mobile PWA
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">System Integrity</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-display mt-1">100%</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            Zero drift detected
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Storage Footprint</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display mt-1">148 KB</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-[12px]">storage</span>
            Compressed local JSON
          </div>
        </div>
      </div>

      {/* Main Table: User Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs font-medium">
              {(['all', 'admin', 'editor', 'viewer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile User Card View */}
        <div className="block md:hidden space-y-3 p-4">
          {filteredUsers.map((u) => {
            const avatarSource =
              u.avatar ||
              u.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
            const isActive = u.status.toLowerCase() === 'active';

            return (
              <div
                key={u.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={avatarSource}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{u.email}</div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {u.status}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      updateAdminUserRole(
                        u.id,
                        e.target.value as AdminUserRecord['role']
                      )
                    }
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize focus:outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="CURATOR / ADMIN">Curator / Admin</option>
                    <option value="EXPLORER">Explorer</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">
                      {u.lastActive}
                    </span>
                    <button
                      onClick={() => deleteAdminUser(idCleaner(u.id))}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Revoke access"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((u) => {
                const avatarSource =
                  u.avatar ||
                  u.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                const isActive =
                  u.status.toLowerCase() === 'active';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarSource}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateAdminUserRole(
                            u.id,
                            e.target.value as AdminUserRecord['role']
                          )
                        }
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                        <option value="CURATOR / ADMIN">Curator / Admin</option>
                        <option value="EXPLORER">Explorer</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {u.lastActive}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => deleteAdminUser(idCleaner(u.id))}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Revoke access"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Flags & Diagnostic Switches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">
            Expedition Atelier Feature Flags
          </h3>
          <p className="text-xs text-slate-500">
            Runtime toggles to enable or restrict experimental planning workflows across client instances.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Smart Pacing & Conflict Analysis
                </div>
                <div className="text-[11px] text-slate-500">
                  Calculates walking buffers between temple districts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.pacingAdvisor}
                onChange={(e) =>
                  setFeatureToggles({ ...featureToggles, pacingAdvisor: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Multi-Currency FX Real-Time Estimation
                </div>
                <div className="text-[11px] text-slate-500">
                  Applies live spot rate conversions for overseas expenses.
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.fxSync}
                onChange={(e) =>
                  setFeatureToggles({ ...featureToggles, fxSync: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Offline Vector Tile Pre-Cache
                </div>
                <div className="text-[11px] text-slate-500">
                  Preloads Kyoto GIS pins for airplane and bullet train travel.
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.offlineMaps}
                onChange={(e) =>
                  setFeatureToggles({ ...featureToggles, offlineMaps: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Security & Audit Trail
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
              Immutable Log
            </span>
          </div>

          <div className="space-y-3 font-mono text-[11px] text-slate-600">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-start justify-between">
              <div>
                <span className="text-primary font-bold">[AUTH]</span> Demo curator session resumed
                from localStorage
              </div>
              <span className="text-slate-400 text-[10px]">10:14 AM</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-start justify-between">
              <div>
                <span className="text-emerald-600 font-bold">[EXPENSE]</span> Added Gion Yoshiba
                Dinner (¥18,000)
              </div>
              <span className="text-slate-400 text-[10px]">09:30 AM</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-start justify-between">
              <div>
                <span className="text-indigo-600 font-bold">[TRIP]</span> Initialized Kyoto & Tokyo
                Autumn Atelier
              </div>
              <span className="text-slate-400 text-[10px]">08:00 AM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                Invite Expedition Collaborator
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Collaborator Email
                </label>
                <input
                  type="email"
                  placeholder="fellow.traveler@domain.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role Permission
                </label>
                <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none">
                  <option value="editor">Editor (Can edit days & expenses)</option>
                  <option value="viewer">Viewer (Read-only itinerary view)</option>
                  <option value="admin">Admin (Full administrative control)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function idCleaner(id: string): string {
  return id;
}
