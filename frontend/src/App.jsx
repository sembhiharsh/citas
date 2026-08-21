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
  Hourglass
} from 'lucide-react';
import logoImg from './assets/logo.jpg';

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

  const [calendarDays, setCalendarDays] = useState([]);
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

  // Fetch Settings & Calendar Availability
  useEffect(() => {
    const initData = async () => {
      try {
        const setRes = await fetch(`${API_BASE}/api/settings`);
        if (setRes.ok) {
          const setData = await setRes.json();
          setSettings(prev => ({ ...prev, ...setData }));
        }

        // Fetch calendar overview for the next 25 days
        const today = new Date();
        const startStr = today.toISOString().split('T')[0];
        const future = new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000);
        const endStr = future.toISOString().split('T')[0];

        const overviewRes = await fetch(`${API_BASE}/api/calendar-overview?start=${startStr}&end=${endStr}`);
        if (overviewRes.ok) {
          const overviewData = await overviewRes.json();
          // Keep only weekdays
          const weekdays = overviewData.filter(d => d.status !== 'weekend');
          setCalendarDays(weekdays);

          const firstAvail = weekdays.find(d => d.status === 'available');
          if (firstAvail) {
            setSelectedDate(firstAvail.date);
          } else if (weekdays.length > 0) {
            setSelectedDate(weekdays[0].date);
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

  const currentDayInfo = useMemo(() => {
    return calendarDays.find(d => d.date === selectedDate);
  }, [calendarDays, selectedDate]);

  const isWaitingListMode = useMemo(() => {
    return currentDayInfo && (currentDayInfo.status === 'blocked' || currentDayInfo.status === 'full');
  }, [currentDayInfo]);

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
    if (isWaitingListMode) msg += ` para el día ${selectedDate} (Lista de Espera / Aviso de Hueco)`;
    if (customServiceText.trim()) msg += `. Detalles del problema: ${customServiceText.trim()}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }, [settings.whatsapp_number, fullCarString, selectedDate, isWaitingListMode, customServiceText]);

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
      status: isWaitingListMode ? 'waiting_list' : 'pending'
    };

    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'No se pudo procesar la solicitud de cita.');
      }

      const data = await res.json();
      const confirmedAppt = data.appointment || payload;
      const isAutoApproved = confirmedAppt.status === 'confirmed';
      const isWaitingList = confirmedAppt.status === 'waiting_list';

      // Generate WhatsApp Link
      const rawWhatsApp = (settings.whatsapp_number || '34600000000').replace(/\D/g, '');
      const cleanTargetPhone = rawWhatsApp.startsWith('34') || rawWhatsApp.length > 9 ? rawWhatsApp : '34' + rawWhatsApp;
      
      const whatsappMsg = isWaitingList 
        ? `¡Hola Auto Talleres Romo! Acabo de registrar una solicitud en *Lista de Espera / Aviso de Hueco* para el ${selectedDate}:\n\n` +
          `👤 *Cliente:* ${payload.name}\n` +
          `📞 *Teléfono:* ${payload.phone}\n` +
          `🚗 *Vehículo:* ${payload.car_model}\n` +
          `🔢 *Matrícula:* ${payload.license_plate}\n` +
          `🛠️ *Servicio:* ${payload.service}\n` +
          `📅 *Día solicitado:* ${selectedDate} a las ${selectedTime} h\n\n` +
          `¡Avisadme si tenéis disponibilidad o se cancela una cita! Gracias.`
        : `¡Hola Auto Talleres Romo! Acabo de registrar una cita desde la web:\n\n` +
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
        isWaitingList,
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
      'LOCATION:Auto Talleres Romo, Carretera de Mataró, 111, 08930 Sant Adrià de Besòs, Barcelona',
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      
      {/* Top Header Bar (Clean White) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Official Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-auto flex items-center justify-center p-1 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <img 
                src={logoImg} 
                alt="Auto Talleres Romo Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-display">
                  {settings.shop_name || 'AUTO TALLERES ROMO'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Multimarca & Diagnosis
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Carretera de Mataró, 111, Sant Adrià de Besòs
              </p>
            </div>
          </div>

          {/* Quick Contact & External Link */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[11px] text-slate-500 flex items-center justify-end gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Recepción abierta hoy
              </span>
              <a 
                href="tel:933812345" 
                className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" /> 93 381 23 45
              </a>
            </div>

            <a
              href="https://romo-mercedesbenz.es/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-300 transition-all flex items-center gap-1.5 shadow-xs"
              title="Web Oficial Romo Mercedes-Benz"
            >
              <span>Acceso Taller</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-grow">
        
        {/* Success / Confirmation Screen */}
        {submittedAppointment ? (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8">
              
              {/* Header Status */}
              <div className="text-center space-y-3">
                <div className={`inline-flex p-4 rounded-2xl ${submittedAppointment.isWaitingList ? 'bg-amber-50 border border-amber-300 text-amber-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'} mb-1`}>
                  {submittedAppointment.isWaitingList ? <Hourglass className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {submittedAppointment.isWaitingList 
                    ? '¡Anotado en Lista de Espera con Éxito!'
                    : (submittedAppointment.isAutoApproved ? '¡Cita Confirmada con Éxito!' : '¡Solicitud Recibida Correctamente!')}
                </h1>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {submittedAppointment.isWaitingList
                    ? `Hemos guardado tu solicitud para el día ${submittedAppointment.formattedDate}. En cuanto se libere un hueco o tengamos disponibilidad, nos pondremos en contacto contigo por teléfono o WhatsApp para darte prioridad.`
                    : (submittedAppointment.isAutoApproved
                      ? 'Tu vehículo ha quedado agendado en el sistema del taller. Te esperamos el día y hora indicados.'
                      : 'Hemos recibido tu solicitud. Nuestro equipo la revisará y te contactaremos de inmediato por teléfono o WhatsApp.')}
                </p>
              </div>

              {/* Appointment Ticket Card */}
              <div className="bg-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalles de la Reserva</span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                    submittedAppointment.isWaitingList 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : (submittedAppointment.isAutoApproved ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-300')
                  }`}>
                    {submittedAppointment.isWaitingList ? '⏳ Lista de Espera' : (submittedAppointment.isAutoApproved ? 'Confirmada' : 'Pendiente')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Titular de la Cita</span>
                    <span className="font-bold text-slate-900">{submittedAppointment.name}</span>
                    <span className="text-xs text-slate-600 block mt-0.5 font-medium">📞 {submittedAppointment.phone}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Vehículo Registrado</span>
                    <span className="font-bold text-slate-900">{submittedAppointment.car_model}</span>
                    <div className="mt-1">
                      <div className="license-plate inline-flex text-xs">
                        <span className="eu-flag">🇪🇸</span>
                        <span>{submittedAppointment.license_plate}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Servicio Solicitado</span>
                    <span className="font-semibold text-slate-800">{submittedAppointment.service}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Fecha y Turno Preferido</span>
                    <span className="font-extrabold text-blue-700 text-base">
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
                      className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{submittedAppointment.isWaitingList ? 'Notificar al Taller por WhatsApp' : 'Notificar por WhatsApp'}</span>
                    </a>
                  )}

                  {!submittedAppointment.isWaitingList && (
                    <button
                      type="button"
                      onClick={downloadCalendarEvent}
                      className="py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-all text-sm shadow-xs"
                    >
                      <CalendarPlus className="w-4 h-4 text-blue-600" />
                      <span>Añadir a mi Calendario</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 flex gap-3 items-start">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Indicaciones del taller:</strong> Si te surge cualquier consulta o necesitas adelantar la reparación por urgencia, llámanos directamente al <strong>93 381 23 45</strong> o escríbenos por WhatsApp.
                  </p>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedAppointment(null);
                      setClientNotes('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 font-semibold underline transition-colors cursor-pointer"
                  >
                    ← Solicitar otra cita o fecha diferente
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          
          /* Main Interactive Booking Page (Light Mode) */
          <div className="space-y-10">
            
            {/* Hero Header & Value Proposition */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Gestión de Cita Previa Oficial</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                Reserva cita para tu vehículo en <span className="text-blue-600">Auto Talleres Romo</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                Mantenimiento oficial multimarca, diagnosis electrónica por ordenador, neumáticos y mecánica en Sant Adrià de Besòs. Confirmación inmediata sin esperas.
              </p>
            </div>

            {/* 3 Trust Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-5xl mx-auto">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
                <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Confirmación Directa</span>
                  <span className="text-[11px] text-slate-500 block">Horario en tiempo real</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
                <FileText className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Presupuesto Claro</span>
                  <span className="text-[11px] text-slate-500 block">Sin sorpresas ni extras</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
                <Car className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Especialistas Multimarca</span>
                  <span className="text-[11px] text-slate-500 block">Todas las marcas europeas</span>
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
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm space-y-3 animate-fade-in shadow-xs">
                      <div className="flex gap-2.5 items-start">
                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-900">Aviso sobre tu solicitud</p>
                          <p className="text-xs text-amber-800 mt-0.5">{errorMessage}</p>
                        </div>
                      </div>
                      {suggestedDate && (
                        <button
                          type="button"
                          onClick={handleApplySuggestedDate}
                          className="w-full py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-xs transition-colors border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Cambiar automáticamente al próximo día libre ({suggestedDate})</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* STEP 1: Selecciona el Servicio */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">1</span>
                        <h2 className="text-lg font-bold text-slate-900 font-display">¿Qué servicio o revisión necesita tu vehículo?</h2>
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
                            className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-blue-200/80 text-blue-900' : 'bg-slate-200/80 text-slate-700'
                              }`}>
                                {svc.badge}
                              </span>
                            </div>
                            <div className="mt-3">
                              <span className={`text-xs font-bold block ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                                {svc.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 line-clamp-2 leading-relaxed">
                                {svc.shortDesc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dedicated Client Issue Box (Always Visible) */}
                    <div className="pt-4 border-t border-slate-100 space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Describe el problema, avería o detalles del trabajo (Opcional):</span>
                        <span className="text-[11px] text-slate-400 font-normal">Síntomas, ruidos, testigos...</span>
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Ej. Noto vibración al frenar a más de 80 km/h, testigo de motor encendido en frío..."
                        value={customServiceText}
                        onChange={(e) => setCustomServiceText(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none resize-none placeholder:text-slate-400 shadow-2xs"
                      />
                    </div>

                    {/* Direct WhatsApp Consultation Button */}
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          ¿Dudas o consulta urgente de tu avería?
                        </span>
                        <span className="text-[11px] text-emerald-700 block mt-0.5">
                          Puedes escribirnos por WhatsApp o enviarnos fotos/vídeos del problema.
                        </span>
                      </div>
                      <a
                        href={directWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Escribir por WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* STEP 2: Datos del Vehículo */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">2</span>
                        <h2 className="text-lg font-bold text-slate-900 font-display">Identificación del Vehículo</h2>
                      </div>
                    </div>

                    {/* Popular Brand Pills */}
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block mb-2">Marcas frecuentes:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_BRANDS.map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => setCarBrand(brand)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              carBrand.toLowerCase() === brand.toLowerCase()
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Marca y Modelo del Vehículo *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Marca (ej. Seat)"
                            value={carBrand}
                            onChange={(e) => setCarBrand(e.target.value)}
                            className="bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-slate-900 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none placeholder:text-slate-400 shadow-2xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Modelo (ej. Ibiza)"
                            value={carModel}
                            onChange={(e) => setCarModel(e.target.value)}
                            className="bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-slate-900 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none placeholder:text-slate-400 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>Matrícula del Vehículo *</span>
                          <span className="text-[11px] text-slate-400 font-normal">Formato: 1234ABC</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            maxLength={10}
                            placeholder="1234ABC"
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                            className="bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-slate-900 font-mono font-bold tracking-widest uppercase text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none w-full placeholder:text-slate-400 shadow-2xs"
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
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">3</span>
                        <h2 className="text-lg font-bold text-slate-900 font-display">Fecha y Turno de Recepción</h2>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Lunes a Viernes</span>
                    </div>

                    {/* Available Date Chips */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-2.5">Selecciona el día de entrega:</label>
                      {loadingDates ? (
                        <div className="text-xs text-slate-500 py-3">Cargando calendario del taller...</div>
                      ) : calendarDays.length === 0 ? (
                        <div className="text-xs text-amber-600 py-2 font-semibold">Consultando disponibilidad...</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {calendarDays.slice(0, 10).map((day) => {
                            const dateStr = day.date;
                            const d = new Date(dateStr + 'T00:00:00');
                            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
                            const dayNum = d.getDate();
                            const monthName = d.toLocaleDateString('es-ES', { month: 'short' });
                            const isSelected = selectedDate === dateStr;
                            const isBlockedOrFull = day.status === 'blocked' || day.status === 'full';

                            return (
                              <button
                                key={dateStr}
                                type="button"
                                onClick={() => setSelectedDate(dateStr)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? (isBlockedOrFull ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20' : 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20')
                                    : (isBlockedOrFull ? 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100')
                                }`}
                              >
                                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                                  {dayName}
                                </span>
                                <span className="text-base font-extrabold block my-0.5">
                                  {dayNum}
                                </span>
                                <span className="text-[10px] capitalize block opacity-80 font-medium">
                                  {monthName}
                                </span>
                                
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 block truncate ${
                                  isSelected 
                                    ? 'bg-white/20 text-white' 
                                    : (isBlockedOrFull ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-100 text-emerald-800')
                                }`}>
                                  {isBlockedOrFull ? '⏳ Lista Espera' : `${day.slots_left} libres`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Waiting List Notice Banner if selected date is blocked or full */}
                    {isWaitingListMode && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5 animate-fade-in shadow-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                          <Hourglass className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Día Completo o Cerrado: Solicitud en Lista de Espera</span>
                        </div>
                        <p className="text-amber-800 text-[11px] leading-relaxed">
                          El taller no tiene citas libres directas para el <strong>{selectedDate}</strong>. Rellena tus datos y nuestro equipo te contactará por teléfono o WhatsApp en cuanto se cancele una cita, se abra un hueco o para ofrecerte la alternativa más cercana.
                        </p>
                      </div>
                    )}

                    {/* Time Slot Picker */}
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold text-slate-800 block">Horario preferido de entrega del coche:</label>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block mb-1.5">Turno Mañana (08:30 - 13:00)</span>
                          <div className="flex flex-wrap gap-2">
                            {MORNING_HOURS.map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setSelectedTime(h)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  selectedTime === h
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {h} h
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block mb-1.5">Turno Tarde (15:00 - 18:30)</span>
                          <div className="flex flex-wrap gap-2">
                            {AFTERNOON_HOURS.map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setSelectedTime(h)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  selectedTime === h
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
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
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">4</span>
                        <h2 className="text-lg font-bold text-slate-900 font-display">Tus Datos de Contacto</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Nombre y Apellidos *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            placeholder="Ej. Carlos Martínez López"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none placeholder:text-slate-400 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Teléfono Móvil (Avisos & WhatsApp) *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="tel"
                            required
                            placeholder="Ej. 612 345 678"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none placeholder:text-slate-400 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-slate-800">Observaciones o Síntomas Adicionales (Opcional)</label>
                      <textarea
                        rows="2"
                        placeholder="Ej. Dejar vehículo antes de ir al trabajo, necesito presupuesto previo de frenos..."
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none resize-none placeholder:text-slate-400 shadow-2xs"
                      />
                    </div>
                  </div>

                </form>
              </div>

              {/* Sticky Summary & Submit Sidebar (Cols 9-12) */}
              <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
                
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                      <span>Resumen de tu Cita</span>
                    </h3>
                    <span className="text-xs text-slate-500">Comprueba los datos antes de confirmar</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500 font-medium">Servicio:</span>
                      <span className="font-bold text-slate-900 text-right max-w-[170px]">
                        {resolvedServiceName}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500 font-medium">Vehículo:</span>
                      <span className="font-bold text-slate-900 text-right">
                        {fullCarString || 'Pendiente de indicar'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500 font-medium">Matrícula:</span>
                      {licensePlate ? (
                        <span className="font-mono font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {licensePlate}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No indicada</span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500 font-medium">Fecha y Turno:</span>
                      <span className={`font-bold text-right ${isWaitingListMode ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {selectedDate ? `${selectedDate} — ${selectedTime} h` : 'Selecciona fecha'}
                        {isWaitingListMode && <span className="block text-[10px] text-amber-600 font-semibold">(Lista de Espera)</span>}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 font-medium">Ubicación:</span>
                      <span className="font-semibold text-slate-800 text-right">Carretera de Mataró, 111 (Sant Adrià)</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    form="appointment-form"
                    disabled={submitting}
                    className={`w-full py-3.5 px-4 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all border-none disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                      isWaitingListMode 
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/20'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Registrando Solicitud...</span>
                      </>
                    ) : (
                      <>
                        <span>{isWaitingListMode ? '⏳ Solicitar en Lista de Espera' : 'Confirmar Solicitud de Cita'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center leading-normal">
                    {isWaitingListMode
                      ? 'Al enviar la solicitud aceptas que el taller te contacte cuando se libere un hueco.'
                      : 'Al solicitar cita aceptas el tratamiento de datos para la gestión del servicio mecánico.'}
                  </p>
                </div>

                {/* Direct Phone & WhatsApp Assistance Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-3 shadow-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>¿Tienes una consulta o urgencia?</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Contáctanos directamente con el taller por teléfono o WhatsApp para atención inmediata.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <a
                      href={directWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Abrir WhatsApp del Taller</span>
                    </a>
                    <a
                      href="tel:933812345"
                      className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-all shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Llamar al taller: 93 381 23 45</span>
                    </a>
                  </div>
                </div>

              </div>

            </div>

            {/* Workshop Facilities & Trust Showcase */}
            <div className="pt-12 border-t border-slate-200 max-w-6xl mx-auto space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 font-display">Taller Mecánico en Sant Adrià de Besòs</h3>
                <p className="text-sm text-slate-600">
                  Instalaciones equipadas con elevadores homologados y equipos de diagnosis multimarca de última generación.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    📍
                  </div>
                  <span className="font-bold text-sm text-slate-900 block">Ubicación & Acceso</span>
                  <p className="text-slate-900 font-bold text-xs leading-snug">
                    Auto Talleres Romo, Carretera de Mataró, 111, 08930 Sant Adrià de Besòs, Barcelona
                  </p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Situados estratégicamente junto a los accesos principales de Sant Adrià y Ronda Litoral. Fácil acceso y aparcamiento de clientes.
                  </p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Auto+Talleres+Romo+Carretera+de+Mataro+111+Sant+Adria+de+Besos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-[11px] pt-1"
                  >
                    <span>Ver en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    ⭐
                  </div>
                  <span className="font-bold text-sm text-slate-900 block">Valoración de Clientes</span>
                  <p className="text-slate-600 leading-relaxed">
                    4.9 / 5 estrellas en reseñas de Google. Máxima transparencia en presupuestos y trato personalizado desde 2004.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                    🕒
                  </div>
                  <span className="font-bold text-sm text-slate-900 block">Horario Ininterrumpido</span>
                  <p className="text-slate-600 leading-relaxed">
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
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{settings.shop_name || 'Auto Talleres Romo'}</span>
            <span>— Taller Mecánico Especializado</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-right">
            <span>Carretera de Mataró, 111, 08930 Sant Adrià de Besòs (Barcelona)</span>
            <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a
        href={directWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-600/40 flex items-center gap-2 border border-emerald-400/40 transition-all hover:scale-105 group"
        title="Consultar por WhatsApp con el taller"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="hidden sm:inline text-xs font-bold pr-1">WhatsApp Taller</span>
      </a>

    </div>
  );
}

export default App;
