import React, { useState, useEffect } from 'react';
import { Wrench, User, Phone, Calendar, Send, CheckCircle2, AlertTriangle, Settings, QrCode } from 'lucide-react';

const getBackendUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  return window.location.origin;
};
const API_BASE = getBackendUrl();

function App() {
  // Settings state (only needed for WhatsApp number and shop name)
  const [settings, setSettings] = useState({
    shop_name: 'Auto Talleres Romo',
    whatsapp_number: ''
  });

  // Booking form state
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    car_model: '',
    license_plate: '',
    service: '',
    datetime: ''
  });
  const [clientFormSubmitted, setClientFormSubmitted] = useState(false);
  const [clientFormLoading, setClientFormLoading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setClientFormLoading(true);
    try {
      if (!clientForm.name || !clientForm.phone || !clientForm.car_model || !clientForm.license_plate || !clientForm.service || !clientForm.datetime) {
        alert('Por favor, rellene todos los campos.');
        setClientFormLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...clientForm, status: 'pending' })
      });

      if (!res.ok) {
        throw new Error('Failed to create appointment');
      }

      const formattedPhone = settings.whatsapp_number ? settings.whatsapp_number.replace(/\D/g, '') : '';
      const messageText = `Hola ${settings.shop_name || 'Auto Talleres Romo'}, me gustaría solicitar una cita:\n👤 *Nombre*: ${clientForm.name}\n📞 *Teléfono*: ${clientForm.phone}\n🚗 *Coche*: ${clientForm.car_model}\n🔢 *Matrícula*: ${clientForm.license_plate}\n🛠️ *Servicio*: ${clientForm.service}\n📅 *Fecha/Hora propuesta*: ${clientForm.datetime.replace('T', ' ')}`;
      const encodedMessage = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/${formattedPhone || '34600000000'}?text=${encodedMessage}`;

      setClientFormSubmitted(true);
      // Automatic opening of WhatsApp has been disabled.
    } catch (err) {
      console.error('Error submitting appointment:', err);
      alert('Error al registrar la cita en el sistema. Inténtelo de nuevo.');
    } finally {
      setClientFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative glow-cyan animate-fade-in">
        <div className="text-center">
          <div className="inline-flex p-3 bg-cyan-500/10 rounded-full border border-cyan-500/30 text-cyan-400 mb-3">
            <Wrench className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {settings.shop_name || 'Auto Talleres Romo'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Solicitud de Cita previa por WhatsApp
          </p>
        </div>
        {clientFormSubmitted ? (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="inline-flex p-3 bg-emerald-500/10 rounded-full border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-white">¡Solicitud Registrada!</h3>
            <p className="text-sm text-slate-350 max-w-xs mx-auto">
              Su solicitud ha sido enviada al taller. Estamos abriendo WhatsApp para que envíe el mensaje de confirmación...
            </p>
            <div className="pt-4">
              <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
            </div>
            <p className="text-xs text-slate-500">
              Si no se abre automáticamente, pulse el botón de abajo.
            </p>
            {/* WhatsApp button disabled */}
          </div>
        ) : (
          <form className="mt-8 space-y-5 text-left" onSubmit={handleClientSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Nombre Completo
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pérez"
                value={clientForm.name}
                onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:border-cyan-500 outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" /> Número de Teléfono
              </label>
              <input
                type="tel"
                required
                placeholder="Ej. +34 600 000 000"
                value={clientForm.phone}
                onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:border-cyan-500 outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Modelo del Coche
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Seat Ibiza 2018"
                  value={clientForm.car_model}
                  onChange={(e) => setClientForm(prev => ({ ...prev, car_model: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Matrícula
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1234ABC"
                  value={clientForm.license_plate}
                  onChange={(e) => setClientForm(prev => ({ ...prev, license_plate: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Servicio / Avería
              </label>
              <textarea
                required
                rows="3"
                placeholder="Explique brevemente qué le ocurre al coche o qué servicio necesita..."
                value={clientForm.service}
                onChange={(e) => setClientForm(prev => ({ ...prev, service: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:border-cyan-500 outline-none transition-colors resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Fecha y Hora sugerida
              </label>
              <input
                type="datetime-local"
                required
                value={clientForm.datetime}
                onChange={(e) => setClientForm(prev => ({ ...prev, datetime: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:border-cyan-500 outline-none transition-colors text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={clientFormLoading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all border-none disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <Send className="w-4 h-4" />
              <span>{clientFormLoading ? 'Procesando...' : 'Solicitar Cita por WhatsApp'}</span>
            </button>
          </form>
        )}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Auto Talleres Romo — Sant Adrià de Besòs, Barcelona
        </div>
      </div>
    </div>
  );
}

export default App;
