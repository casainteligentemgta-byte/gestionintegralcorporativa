import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface UserProfile {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    role: string;
    status: 'pending' | 'active' | 'suspended' | 'rejected';
    created_at: string;
    activated_at: string | null;
    activated_by: string | null;
    notes: string | null;
}

interface UserManagementProps {
    onNavigate: (view: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onNavigate }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [filter]);

    const loadUsers = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const activateUser = async (userId: string, role: string) => {
        try {
            setActionLoading(true);

            // Call the activate_user function
            const { data, error } = await supabase.rpc('activate_user', {
                target_user_id: userId,
                assign_role: role
            });

            if (error) throw error;

            alert('Usuario activado exitosamente');
            setShowModal(false);
            setSelectedUser(null);
            await loadUsers();
        } catch (error: any) {
            console.error('Error activating user:', error);
            alert('Error al activar usuario: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'rejected') => {
        try {
            setActionLoading(true);

            const { error } = await supabase
                .from('profiles')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (error) throw error;

            alert(`Usuario ${newStatus === 'active' ? 'activado' : newStatus === 'suspended' ? 'suspendido' : 'rechazado'} exitosamente`);
            setShowModal(false);
            setSelectedUser(null);
            await loadUsers();
        } catch (error: any) {
            console.error('Error updating user:', error);
            alert('Error al actualizar usuario: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-amber-500/20 text-amber-500',
            active: 'bg-green-500/20 text-green-500',
            suspended: 'bg-orange-500/20 text-orange-500',
            rejected: 'bg-red-500/20 text-red-500'
        };

        const labels = {
            pending: 'Pendiente',
            active: 'Activo',
            suspended: 'Suspendido',
            rejected: 'Rechazado'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    const getRoleBadge = (role: string) => {
        const roleLabels: Record<string, string> = {
            admin: 'Administrador',
            gerente: 'Gerente',
            manager: 'Manager',
            supervisor: 'Supervisor',
            almacenero: 'Almacenero',
            viewer: 'Visualizador',
            obrero: 'Obrero'
        };

        return (
            <span className="px-2 py-1 bg-white/5 text-white/60 rounded text-xs">
                {roleLabels[role] || role}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className="h-10 w-10 flex items-center justify-center rounded-apple bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-stone-400">arrow_back</span>
                </button>

                <div className="text-center">
                    <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Administración</p>
                    <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Gestión de Usuarios</h1>
                </div>

                <div className="w-10"></div>
            </header>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'all', label: 'Todos', count: users.length },
                    { key: 'pending', label: 'Pendientes', count: users.filter(u => u.status === 'pending').length },
                    { key: 'active', label: 'Activos', count: users.filter(u => u.status === 'active').length },
                    { key: 'suspended', label: 'Suspendidos', count: users.filter(u => u.status === 'suspended').length }
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key as typeof filter)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filter === key
                                ? 'bg-primary text-black'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                    >
                        {label} ({count})
                    </button>
                ))}
            </div>

            {/* Users Table */}
            <div className="glass-card rounded-premium overflow-hidden border-white/10">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white/40 text-sm">Cargando usuarios...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-white/20 text-6xl mb-4">group_off</span>
                        <p className="text-white/40 text-sm">No hay usuarios {filter !== 'all' ? filter + 's' : ''}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Email</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nombre</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Rol</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Estado</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Registrado</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-sm text-white">{user.email}</td>
                                        <td className="px-4 py-3 text-sm text-white/60">{user.full_name || '-'}</td>
                                        <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                                        <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                                        <td className="px-4 py-3 text-xs text-white/40">
                                            {new Date(user.created_at).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowModal(true);
                                                }}
                                                className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Gestionar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Management Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="glass-card rounded-premium p-6 max-w-md w-full space-y-6 border-white/10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Gestionar Usuario</h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedUser(null);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-white/60">close</span>
                            </button>
                        </div>

                        <div className="space-y-3 bg-white/5 rounded-xl p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Email:</span>
                                <span className="text-white font-medium">{selectedUser.email}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Estado Actual:</span>
                                {getStatusBadge(selectedUser.status)}
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Rol Actual:</span>
                                {getRoleBadge(selectedUser.role)}
                            </div>
                        </div>

                        {selectedUser.status === 'pending' && (
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Asignar Rol</label>
                                <select
                                    id="role-select"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    defaultValue="viewer"
                                >
                                    <option value="viewer">Visualizador</option>
                                    <option value="obrero">Obrero</option>
                                    <option value="almacenero">Almacenero</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="manager">Manager</option>
                                    <option value="gerente">Gerente</option>
                                    <option value="admin">Administrador</option>
                                </select>

                                <button
                                    onClick={() => {
                                        const select = document.getElementById('role-select') as HTMLSelectElement;
                                        activateUser(selectedUser.user_id, select.value);
                                    }}
                                    disabled={actionLoading}
                                    className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Activar Usuario
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {selectedUser.status === 'active' && (
                            <button
                                onClick={() => updateUserStatus(selectedUser.user_id, 'suspended')}
                                disabled={actionLoading}
                                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">block</span>
                                        Suspender Usuario
                                    </>
                                )}
                            </button>
                        )}

                        {selectedUser.status === 'suspended' && (
                            <button
                                onClick={() => updateUserStatus(selectedUser.user_id, 'active')}
                                disabled={actionLoading}
                                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Reactivar Usuario
                                    </>
                                )}
                            </button>
                        )}

                        {selectedUser.status === 'pending' && (
                            <button
                                onClick={() => updateUserStatus(selectedUser.user_id, 'rejected')}
                                disabled={actionLoading}
                                className="w-full h-12 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="w-5 h-5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">cancel</span>
                                        Rechazar Solicitud
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
