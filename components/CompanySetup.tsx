import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface CompanySetupProps {
    onComplete: () => void;
}

/**
 * CompanySetup Component
 * Pantalla de configuración inicial para que el usuario registre su compañía
 * Se muestra solo la primera vez que un usuario inicia sesión
 */
const CompanySetup: React.FC<CompanySetupProps> = ({ onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        rif: '',
        email: '',
        phone: '',
        address: '',
        city: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('El nombre de la compañía es obligatorio');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Llamar a la función de Supabase para crear compañía
            const { data, error: rpcError } = await supabase.rpc('create_company_and_assign', {
                company_name: formData.name,
                company_rif: formData.rif || null,
                company_email: formData.email || null,
                company_phone: formData.phone || null,
                company_address: formData.address || null,
                company_city: formData.city || null
            });

            if (rpcError) {
                console.error('Error creating company:', rpcError);
                throw new Error(rpcError.message);
            }

            // Éxito - recargar para aplicar cambios
            onComplete();

        } catch (err: any) {
            console.error('Setup error:', err);
            setError(err.message || 'Error al crear la compañía. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full glass-card rounded-premium p-8 space-y-8 border-primary/20">

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-primary text-5xl">business</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Bienvenido a KORE</h1>
                    <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
                        Para comenzar, necesitamos algunos datos de tu compañía. Esta información te ayudará a gestionar mejor tu negocio.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Nombre de la Compañía */}
                    <div className="space-y-2">
                        <label className="block text-white/80 text-sm font-medium">
                            Nombre de la Compañía *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Ej: Constructora ABC C.A."
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    {/* RIF */}
                    <div className="space-y-2">
                        <label className="block text-white/80 text-sm font-medium">
                            RIF
                        </label>
                        <input
                            type="text"
                            name="rif"
                            value={formData.rif}
                            onChange={handleChange}
                            placeholder="Ej: J-12345678-9"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    {/* Email y Teléfono en Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-white/80 text-sm font-medium">
                                Email Corporativo
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contacto@empresa.com"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-white/80 text-sm font-medium">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+58 424-1234567"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2">
                        <label className="block text-white/80 text-sm font-medium">
                            Dirección
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Av. Principal, Edificio X, Piso Y"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    {/* Ciudad */}
                    <div className="space-y-2">
                        <label className="block text-white/80 text-sm font-medium">
                            Ciudad
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Caracas, Miranda"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-500">error</span>
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                            <div className="space-y-1">
                                <h3 className="text-primary font-bold text-sm">Período de Prueba</h3>
                                <p className="text-white/60 text-xs leading-relaxed">
                                    Tienes 30 días de prueba gratuita para explorar todas las funcionalidades de KORE.
                                    No se requiere tarjeta de crédito.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                Creando compañía...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check_circle</span>
                                Comenzar a Usar KORE
                            </>
                        )}
                    </button>

                    <p className="text-white/30 text-xs text-center">
                        Al continuar, aceptas nuestros términos de servicio y política de privacidad
                    </p>
                </form>
            </div>
        </div>
    );
};

export default CompanySetup;
