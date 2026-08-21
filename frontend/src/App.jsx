import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Car,
  Calendar,
  Clock,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  MessageSquare,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info,
  CalendarPlus,
  FileText,
  Gauge,
  Disc,
  ClipboardCheck,
  Cpu,
  Wind,
  Navigation
} from 'lucide-react';

const getBackendUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  return window.location.origin;
};
const API_BASE = getBackendUrl();

const POPULAR_BRANDS = [
  'SEAT', 'Volkswagen', 'Mercedes-Benz', 'Audi', 'BMW', 'Renault', 'Peugeot', 'Toyota', 'Ford', 'Citroën', 'Hyundai', 'Kia', 'Nissan', 'Dacia'
];

const SERVICES_CATALOG = [
  {
    id: 'mantenimiento',
    title: 'Mantenimiento & Cambio de Aceite',
    shortDesc: 'Aceite sintético + filtros + 30 puntos de seguridad',
    duration: '45-60 min',
    icon: Wrench,
    badge: 'Popular'
  },
  {
    id: 'frenos',
    title: 'Frenos & Suspensión',
    shortDesc: 'Pastillas, discos, amortiguadores y líquido',
    duration: '60 min',
    icon: Disc,
    badge: 'Seguridad'
  },
  {
    id: 'pre-itv',
    title: 'Pre-ITV & Pase de ITV',
    shortDesc: 'Revisión completa de gases, luces, frenada y gestión',
    duration: '90 min',
    icon: ClipboardCheck,
    badge: 'Recomendado'
  },
  {
    id: 'diagnosis',
    title: 'Diagnosis Electrónica & Motor',
    shortDesc: 'Lectura OBD de centralita, fallos y testigos motor',
    duration: '30-45 min',
    icon: Cpu,
    badge: 'Especialistas'
  },
  {
    id: 'climatizacion',
    title: 'Climatización & Carga de Gas',
    shortDesc: 'Carga A/C R134a/R1234yf + desinfección de conductos',
    duration: '45 min',
    icon: Wind,
    badge: 'Confort'
  },
  {
    id: 'neumaticos',
    title: 'Neumáticos & Paralelo',
    shortDesc: 'Montaje, equilibrado y alineación de dirección',
    duration: '45 min',
    icon: Gauge,
    badge: 'Garantizado'
  },
  {
    id: 'mecanica-general',
    title: 'Mecánica General & Averías',
    shortDesc: 'Embrague, distribución, ruidos extraños o presupuesto',
    duration: 'A determinar',
    icon: Car,
    badge: 'Diagnóstico'
  }
];

const MORNING_HOURS = ['08:30', '09:30', '10:30', '11:30', '12:30'];
const AFTERNOON_HOURS = ['15:00', '16:00', '17:00', '17:30'];

function App() {
  const [settings, setSettings] = useState({
    shop_name: 'Auto Talleres Romo',
    whatsapp_number: '34600000000',
    opening_hours: 'Lunes a Viernes 08:30 - 13:00 / 15:00 - 18:30'
  });

  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);

  // Form State
  const [selectedService, setSelectedService] = useState('mantenimiento');
  const [customServiceText, setCustomServiceText] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:30');
  
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Flow State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [suggestedDate, setSuggestedDate] = useState(null);
  const [submittedAppointment, setSubmittedAppointment] = useState(null);

  // Fetch Settings & Available Dates
  useEffect(() => {
    const initData = async () => {
      try {
        const setRes = await fetch(`${API_BASE}/api/settings`);
        if (setRes.ok) {
          const setData = await setRes.json();
          setSettings(prev => ({ ...prev, ...setData }));
        }

        // Fetch available dates for the next 3 weeks
        const today = new Date();
        const startStr = today.toISOString().split('T')[0];
        const future = new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000);
        const endStr = future.toISOString().split('T')[0];

        const datesRes = await fetch(`${API_BASE}/api/available-dates?start=${startStr}&end=${endStr}`);
        if (datesRes.ok) {
          const datesData = await datesRes.json();
          setAvailableDates(datesData);
          if (datesData.length > 0) {
            setSelectedDate(datesData[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoadingDates(false);
      }
    };
    initData();
  }, []);

  const formatSelectedDateTime = useMemo(() => {
    if (!selectedDate || !selectedTime) return '';
    return `${selectedDate}T${selectedTime}:00`;
  }, [selectedDate, selectedTime]);

  const fullCarString = useMemo(() => {
    const b = carBrand.trim();
    const m = carModel.trim();
    if (b && m) return `${b} ${m}`;
    return b || m || '';
  }, [carBrand, carModel]);

  const resolvedServiceName = useMemo(() => {
    const matched = SERVICES_CATALOG.find(s => s.id === selectedService);
    if (!matched) return selectedService;
    if (customServiceText.trim()) {
      return `${matched.title} - ${customServiceText.trim()}`;
    }
    return matched.title;
  }, [selectedService, customServiceText]);

  const directWhatsAppUrl = useMemo(() => {
    const rawWhatsApp = (settings.whatsapp_number || '34600000000').replace(/\D/g, '');
    const cleanPhone = rawWhatsApp.startsWith('34') || rawWhatsApp.length > 9 ? rawWhatsApp : '34' + rawWhatsApp;
    let msg = 'Hola Auto Talleres Romo, me gustaría consultar una cita o avería para mi vehículo';
    if (fullCarString) msg += ` (${fullCarString})`;
    if (customServiceText.trim()) msg += `. Detalles del problema: ${customServiceText.trim()}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }, [settings.whatsapp_number, fullCarString, customServiceText]);

  const handleApplySuggestedDate = () => {
    if (suggestedDate) {
      setSelectedDate(suggestedDate);
      setErrorMessage(null);
      setSuggestedDate(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuggestedDate(null);

    if (!clientName.trim()) {
      setErrorMessage('Por favor, indica tu nombre completo.');
      return;
    }
    if (!clientPhone.trim() || clientPhone.length < 8) {
      setErrorMessage('Por favor, indica un número de teléfono de contacto válido.');
      return;
    }
    if (!fullCarString) {
      setErrorMessage('Por favor, indica la marca o modelo de tu coche.');
      return;
    }
    if (!licensePlate.trim()) {
      setErrorMessage('Por favor, introduce la matrícula del vehículo.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setErrorMessage('Por favor, selecciona una fecha y hora para tu cita.');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: clientName.trim(),
      phone: clientPhone.trim(),
      car_model: fullCarString,
      license_plate: licensePlate.trim().toUpperCase(),
      service: clientNotes.trim() ? `${resolvedServiceName} (Nota: ${clientNotes.trim()})` : resolvedServiceName,
      datetime: formatSelectedDateTime,
      status: 'pending'
    };

    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 409) {
          const data = await res.json();
          const detail = data.detail || 'Este día ya está completo.';
          setErrorMessage(detail);
          const dateMatch = detail.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            setSuggestedDate(dateMatch[1]);
          }
          return;
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'No se pudo procesar la solicitud de cita.');
        }
      }

      const data = await res.json();
      const confirmedAppt = data.appointment || payload;
      const isAutoApproved = confirmedAppt.status === 'confirmed';

      // Generate WhatsApp Link
      const rawWhatsApp = (settings.whatsapp_number || '34600000000').replace(/\D/g, '');
      const cleanTargetPhone = rawWhatsApp.startsWith('34') || rawWhatsApp.length > 9 ? rawWhatsApp : '34' + rawWhatsApp;
      
      const whatsappMsg = `¡Hola Auto Talleres Romo! Acabo de registrar una cita desde la web:\n\n` +
        `👤 *Cliente:* ${payload.name}\n` +
        `📞 *Teléfono:* ${payload.phone}\n` +
        `🚗 *Vehículo:* ${payload.car_model}\n` +
        `🔢 *Matrícula:* ${payload.license_plate}\n` +
        `🛠️ *Servicio:* ${payload.service}\n` +
        `📅 *Fecha y Hora:* ${selectedDate} a las ${selectedTime} h\n\n` +
        `¡Quedo a la espera de su confirmación! Muchas gracias.`;

      const whatsappUrl = `https://wa.me/${cleanTargetPhone}?text=${encodeURIComponent(whatsappMsg)}`;

      setSubmittedAppointment({
        ...confirmedAppt,
        isAutoApproved,
        whatsappUrl,
        formattedDate: selectedDate,
        formattedTime: selectedTime
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting appointment:', err);
      setErrorMessage(err.message || 'Ha ocurrido un error en la conexión. Por favor, inténtelo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCalendarEvent = () => {
    if (!submittedAppointment) return;
    const dt = new Date(submittedAppointment.datetime || formatSelectedDateTime);
    const endDt = new Date(dt.getTime() + 60 * 60 * 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const toICSDate = (d) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Auto Talleres Romo//Cita Taller//ES',
      'BEGIN:VEVENT',
      `SUMMARY:Cita Taller - ${submittedAppointment.service || resolvedServiceName}`,
      `DESCRIPTION:Cita en Auto Talleres Romo para ${submittedAppointment.car_model || fullCarString} (${submittedAppointment.license_plate || licensePlate}).`,
      'LOCATION:Auto Talleres Romo, Sant Adrià de Besòs, Barcelona',
      `DTSTART:${toICSDate(dt)}`,
      `DTEND:${toICSDate(endDt)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Cita-Talleres-Romo-${submittedAppointment.formattedDate || 'reserva'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Workshop Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white font-display">
                  {settings.shop_name || 'AUTO TALLERES ROMO'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Multimarca & Diagnosis
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Sant Adrià de Besòs, Barcelona
              </p>
            </div>
          </div>

          {/* Quick Contact & Admin Link */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Recepción abierta hoy
              </span>
              <a 
                href="tel:933812345" 
                className="text-sm font-semibold text-slate-200 hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 text-blue-400" /> 93 381 23 45
              </a>
            </div>

            <a
              href="https://romo-mercedesbenz.es/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-700/80 transition-all flex items-center gap-1.5 shadow-sm"
              title="Web Oficial Romo Mercedes-Benz"
            >
              <span>Acceso Taller</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-grow">
        
        {/* Success / Confirmation Screen */}
        {submittedAppointment ? (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-[#131B2A] border border-slate-700/80 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8">
              
              {/* Header Status */}
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {submittedAppointment.isAutoApproved ? '¡Cita Confirmada con Éxito!' : '¡Solicitud Recibida Correctamente!'}
                </h1>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {submittedAppointment.isAutoApproved
                    ? 'Tu vehículo ha quedado agendado en el sistema del taller. Te esperamos el día y hora indicados.'
                    : 'Hemos recibido tu solicitud. Nuestro equipo la revisará y te contactaremos de inmediato por teléfono o WhatsApp.'}
                </p>
              </div>

              {/* Appointment Ticket Card */}
              <div className="bg-[#0B0F17] rounded-xl p-5 sm:p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalles de la Reserva</span>
                  <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
                    {submittedAppointment.isAutoApproved ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Titular de la Cita</span>
                    <span className="font-semibold text-slate-200">{submittedAppointment.name}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">📞 {submittedAppointment.phone}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Vehículo Registrado</span>
                    <span className="font-semibold text-slate-200">{submittedAppointment.car_model}</span>
                    <div className="mt-1">
                      <div className="license-plate inline-flex text-xs">
                        <span className="eu-flag">🇪🇸</span>
                        <span>{submittedAppointment.license_plate}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Servicio Solicitado</span>
                    <span className="font-medium text-slate-200">{submittedAppointment.service}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Fecha y Hora de Entrega</span>
                    <span className="font-bold text-blue-400 text-base">
                      {submittedAppointment.formattedDate} — {submittedAppointment.formattedTime} h
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Instructions */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {submittedAppointment.whatsappUrl && (
                    <a
                      href={submittedAppointment.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Notificar por WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={downloadCalendarEvent}
                    className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all text-sm"
                  >
                    <CalendarPlus className="w-4 h-4 text-blue-400" />
                    <span>Añadir a mi Calendario</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 flex gap-3 items-start">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Indicaciones de llegada:</strong> Por favor, acude con 5 minutos de antelación y la documentación del vehículo (ficha técnica y permiso de circulación). Si necesitas modificar o cancelar la cita, llámanos al 93 381 23 45.
                  </p>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedAppointment(null);
                      setClientNotes('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors cursor-pointer"
                  >
                    ← Solicitar otra cita diferente
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          
          /* Main Interactive Booking Page */
          <div className="space-y-10">
            
            {/* Hero Header & Value Proposition */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gestión de Cita Previa Oficial</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                Reserva cita para tu vehículo en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Auto Talleres Romo</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
                Mantenimiento oficial multimarca, diagnosis electrónica por ordenador, neumáticos y mecánica en Sant Adrià de Besòs. Confirmación inmediata sin esperas.
              </p>
            </div>

            {/* 3 Trust Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-5xl mx-auto">
              <div className="bg-[#131B2A]/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Confirmación Directa</span>
                  <span className="text-[11px] text-slate-400 block">Horario en tiempo real</span>
                </div>
              </div>

              <div className="bg-[#131B2A]/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Presupuesto Claro</span>
                  <span className="text-[11px] text-slate-400 block">Sin sorpresas ni extras</span>
                </div>
              </div>

              <div className="bg-[#131B2A]/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                <Car className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Especialistas Multimarca</span>
                  <span className="text-[11px] text-slate-400 block">Todas las marcas europeas</span>
                </div>
              </div>
            </div>

            {/* Form Layout: Main Flow + Sticky Summary Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
              
              {/* Form Steps (Cols 1-8) */}
              <div className="lg:col-span-8 space-y-8">
                <form id="appointment-form" onSubmit={handleFormSubmit} className="space-y-8">
                  
                  {/* Global Error Notice */}
                  {errorMessage && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-sm space-y-3 animate-fade-in">
                      <div className="flex gap-2.5 items-start">
                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-300">Aviso sobre tu solicitud</p>
                          <p className="text-xs text-amber-200/90 mt-0.5">{errorMessage}</p>
                        </div>
                      </div>
                      {suggestedDate && (
                        <button
                          type="button"
                          onClick={handleApplySuggestedDate}
                          className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-semibold rounded-lg text-xs transition-colors border border-amber-500/40 flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Cambiar automáticamente al próximo día libre ({suggestedDate})</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* STEP 1: Selecciona el Servicio */}
                  <div className="bg-[#131B2A] border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                        <h2 className="text-lg font-bold text-white font-display">¿Qué servicio o revisión necesita tu vehículo?</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {SERVICES_CATALOG.map((svc) => {
                        const IconComp = svc.icon;
                        const isSelected = selectedService === svc.id;
                        return (
                          <div
                            key={svc.id}
                            onClick={() => setSelectedService(svc.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                              isSelected
                                ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500'
                                : 'bg-[#0B0F17]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#0B0F17]'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {svc.badge}
                              </span>
                            </div>
                            <div className="mt-2.5">
                              <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                {svc.title}
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-0.5 line-clamp-2">
                                {svc.shortDesc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dedicated Client Issue Box */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Describe el problema, avería o detalles del trabajo (Opcional):</span>
                        <span className="text-[11px] text-slate-500">Síntomas, ruidos, testigos...</span>
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Ej. Noto vibración al frenar a más de 80 km/h, o se enciende testigo de motor en frío..."
                        value={customServiceText}
                        onChange={(e) => setCustomServiceText(e.target.value)}
                        className="w-full bg-[#0B0F17] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>

                    {/* Direct WhatsApp Consultation Button */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          ¿Dudas o consulta urgente de tu avería?
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Puedes escribirnos por WhatsApp o enviarnos fotos/vídeos del problema.
                        </span>
                      </div>
                      <a
                        href={directWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Escribir por WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* STEP 2: Datos del Vehículo */}
                  <div className="bg-[#131B2A] border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                        <h2 className="text-lg font-bold text-white font-display">Identificación del Vehículo</h2>
                      </div>
                    </div>

                    {/* Popular Brand Pills */}
                    <div>
                      <span className="text-xs text-slate-400 block mb-2">Marcas frecuentes:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_BRANDS.map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => setCarBrand(brand)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              carBrand.toLowerCase() === brand.toLowerCase()
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Marca y Modelo del Vehículo *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Marca (ej. Seat)"
                            value={carBrand}
                            onChange={(e) => setCarBrand(e.target.value)}
                            className="bg-[#0B0F17] border border-slate-700/80 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Modelo (ej. Ibiza)"
                            value={carModel}
                            onChange={(e) => setCarModel(e.target.value)}
                            className="bg-[#0B0F17] border border-slate-700/80 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                          <span>Matrícula del Vehículo *</span>
                          <span className="text-[11px] text-slate-500">Formato: 1234ABC</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            maxLength={10}
                            placeholder="1234ABC"
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                            className="bg-[#0B0F17] border border-slate-700/80 rounded-xl py-2.5 px-3 text-slate-100 font-mono font-bold tracking-widest uppercase text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                          />
                          {licensePlate && (
                            <div className="license-plate shrink-0 text-xs">
                              <span className="eu-flag">🇪🇸</span>
                              <span>{licensePlate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: Fecha y Hora */}
                  <div className="bg-[#131B2A] border border-slate-800 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                        <h2 className="text-lg font-bold text-white font-display">Fecha y Turno de Recepción</h2>
                      </div>
                      <span className="text-xs text-slate-400">Lunes a Viernes</span>
                    </div>

                    {/* Available Date Chips */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2.5">Selecciona el día de entrega:</label>
                      {loadingDates ? (
                        <div className="text-xs text-slate-400 py-3">Cargando disponibilidad del taller...</div>
                      ) : availableDates.length === 0 ? (
                        <div className="text-xs text-amber-400 py-2">Consultando calendario...</div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {availableDates.slice(0, 10).map((dateStr) => {
                            const d = new Date(dateStr + 'T00:00:00');
                            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
                            const dayNum = d.getDate();
                            const monthName = d.toLocaleDateString('es-ES', { month: 'short' });
                            const isSelected = selectedDate === dateStr;

                            return (
                              <button
                                key={dateStr}
                                type="button"
                                onClick={() => setSelectedDate(dateStr)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                                    : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                                  {dayName}
                                </span>
                                <span className="text-base font-extrabold block my-0.5">
                                  {dayNum}
                                </span>
                                <span className="text-[10px] capitalize block opacity-75">
                                  {monthName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Time Slot Picker */}
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-semibold text-slate-300 block">Horario preferido de entrega del coche:</label>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">Turno Mañana (08:30 - 13:00)</span>
                          <div className="flex flex-wrap gap-2">
                            {MORNING_HOURS.map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setSelectedTime(h)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  selectedTime === h
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                    : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {h} h
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">Turno Tarde (15:00 - 18:30)</span>
                          <div className="flex flex-wrap gap-2">
                            {AFTERNOON_HOURS.map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setSelectedTime(h)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  selectedTime === h
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                    : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {h} h
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 4: Datos de Contacto */}
                  <div className="bg-[#131B2A] border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                        <h2 className="text-lg font-bold text-white font-display">Tus Datos de Contacto</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Nombre y Apellidos *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            placeholder="Ej. Carlos Martínez López"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full bg-[#0B0F17] border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Teléfono Móvil (Avisos & WhatsApp) *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <input
                            type="tel"
                            required
                            placeholder="Ej. 612 345 678"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full bg-[#0B0F17] border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold text-slate-300">Observaciones o Síntomas Adicionales (Opcional)</label>
                      <textarea
                        rows="2"
                        placeholder="Ej. Dejar vehículo antes de ir al trabajo, necesito presupuesto previo de frenos..."
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        className="w-full bg-[#0B0F17] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>
                  </div>

                </form>
              </div>

              {/* Sticky Summary & Submit Sidebar (Cols 9-12) */}
              <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
                
                <div className="bg-[#131B2A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                      <span>Resumen de tu Cita</span>
                    </h3>
                    <span className="text-xs text-slate-400">Comprueba los datos antes de confirmar</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                      <span className="text-slate-400">Servicio:</span>
                      <span className="font-semibold text-slate-200 text-right max-w-[170px]">
                        {resolvedServiceName}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                      <span className="text-slate-400">Vehículo:</span>
                      <span className="font-semibold text-slate-200 text-right">
                        {fullCarString || 'Pendiente de indicar'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                      <span className="text-slate-400">Matrícula:</span>
                      {licensePlate ? (
                        <span className="font-mono font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {licensePlate}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No indicada</span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                      <span className="text-slate-400">Fecha y Hora:</span>
                      <span className="font-bold text-emerald-400 text-right">
                        {selectedDate ? `${selectedDate} — ${selectedTime} h` : 'Selecciona fecha'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400">Ubicación:</span>
                      <span className="font-medium text-slate-300 text-right">Sant Adrià de Besòs</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    form="appointment-form"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all border-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Registrando Cita...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmar Solicitud de Cita</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-500 text-center leading-normal">
                    Al solicitar cita aceptas el tratamiento de datos para la gestión del servicio mecánico.
                  </p>
                </div>

                {/* Direct Phone Assistance Card */}
                <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>¿Tienes una urgencia mecánica?</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Si tu vehículo no arranca o necesitas servicio de grúa de urgencia, contáctanos directamente por teléfono.
                  </p>
                  <a
                    href="tel:933812345"
                    className="inline-flex items-center gap-1.5 font-bold text-blue-400 hover:text-blue-300 pt-1"
                  >
                    <span>Llamar al taller: 93 381 23 45</span>
                    <ChevronRight className="w-3 h-3" />
                  </a>
                </div>

              </div>

            </div>

            {/* Workshop Facilities & Trust Showcase */}
            <div className="pt-12 border-t border-slate-800/80 max-w-6xl mx-auto space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-2xl font-bold text-white font-display">Taller Mecánico en Sant Adrià de Besòs</h3>
                <p className="text-sm text-slate-400">
                  Instalaciones equipadas con elevadores homologados y equipos de diagnosis multimarca de última generación.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#131B2A] border border-slate-800 p-5 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold">
                    📍
                  </div>
                  <span className="font-bold text-sm text-white block">Ubicación & Acceso</span>
                  <p className="text-slate-400 leading-relaxed">
                    Situados estratégicamente junto a los accesos principales de Sant Adrià y Ronda Litoral. Fácil acceso y aparcamiento de clientes.
                  </p>
                </div>

                <div className="bg-[#131B2A] border border-slate-800 p-5 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-400 flex items-center justify-center font-bold">
                    ⭐
                  </div>
                  <span className="font-bold text-sm text-white block">Valoración de Clientes</span>
                  <p className="text-slate-400 leading-relaxed">
                    4.9 / 5 estrellas en reseñas de Google. Máxima transparencia en presupuestos y trato personalizado desde 2004.
                  </p>
                </div>

                <div className="bg-[#131B2A] border border-slate-800 p-5 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-400 flex items-center justify-center font-bold">
                    🕒
                  </div>
                  <span className="font-bold text-sm text-white block">Horario Ininterrumpido</span>
                  <p className="text-slate-400 leading-relaxed">
                    Mañanas: 08:30 a 13:00 h<br />
                    Tardes: 15:00 a 18:30 h<br />
                    De lunes a viernes.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Modern Workshop Footer */}
      <footer className="bg-[#090D14] border-t border-slate-800/80 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">{settings.shop_name || 'Auto Talleres Romo'}</span>
            <span>— Taller Mecánico Especializado</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Sant Adrià de Besòs (Barcelona)</span>
            <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a
        href={directWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-600/50 flex items-center gap-2 border border-emerald-400/40 transition-all hover:scale-105 group"
        title="Consultar por WhatsApp con el taller"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="hidden sm:inline text-xs font-bold pr-1">WhatsApp Taller</span>
      </a>

    </div>
  );
}

export default App;
