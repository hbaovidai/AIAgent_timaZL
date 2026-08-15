import React, { useEffect, useState } from 'react';
import { Users, Shield, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (user: User) => {
    const nextRole = user.role === 'OWNER' ? 'USER' : 'OWNER';
    try {
      await api.updateUserRole(user.id, nextRole);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Quản lý Người dùng & Phân quyền (RBAC)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Phân biệt quyền Chủ nhân (OWNER) và Người dùng thường (USER) trên từng tài khoản Zalo / Mock Channel.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
              <th style={{ padding: '0.75rem' }}>Tên hiển thị</th>
              <th style={{ padding: '0.75rem' }}>Kênh</th>
              <th style={{ padding: '0.75rem' }}>External User ID</th>
              <th style={{ padding: '0.75rem' }}>Vai trò hiện tại</th>
              <th style={{ padding: '0.75rem' }}>Thời gian tạo</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Chuyển đổi Quyền</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                  {u.display_name}
                </td>
                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{u.channel}</span>
                </td>
                <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                  {u.external_user_id}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge ${u.role === 'OWNER' ? 'badge-owner' : 'badge-user'}`}>
                    {u.role === 'OWNER' ? <Shield size={10} /> : <UserIcon size={10} />}
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.75rem' }}>
                  {u.created_at}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleRole(u)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                  >
                    Đổi thành {u.role === 'OWNER' ? 'USER' : 'OWNER'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
