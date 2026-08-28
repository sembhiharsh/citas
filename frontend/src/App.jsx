import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Car,
  Calendar,
  Clock,
  Phone,
  User,
  Mail,
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
  Hourglass,
  ShieldCheck,
  Zap,
  Activity,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  X
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
    id: 'pre-itv',
    title: 'Pre-ITV',
    shortDesc: 'Pre-ITV con equipos homologados para los centros de ITV.',
    fullDesc: 'Pre-ITV con equipos homologados para los centros de ITV. Revisión completa de gases y emisiones, prueba de frenada en frenómetro, alumbrado y reglaje de faros, holguras de dirección y suspensión en foso/elevador.',
    category: 'itv_mantenimiento',
    icon: ClipboardCheck,
    isHomologated: true
  },
  {
    id: 'aceite-filtros',
    title: 'Aceite y Filtros',
    shortDesc: 'Cambio de aceite y filtros.',
    fullDesc: 'Cambio de aceite homologado según especificaciones del fabricante, sustitución de filtro de aceite, filtro de aire, habitáculo y combustible con revisión de niveles.',
    category: 'itv_mantenimiento',
    icon: Wrench
  },
  {
    id: 'frenos',
    title: 'Frenos',
    shortDesc: 'Sustitución de pastillas y discos de frenos. Reparación sistemas A.B.S. Cambio frenos tipo tambor. Sustitución latiguillos y liquido circuito etc.',
    fullDesc: 'Sustitución de pastillas y discos de frenos. Reparación sistemas A.B.S. Cambio frenos tipo tambor. Sustitución latiguillos y líquido de circuito de frenos.',
    category: 'frenos_seguridad',
    icon: Disc
  },
  {
    id: 'amortiguadores',
    title: 'Amortiguadores y Suspensión',
    shortDesc: 'Revisión y cambio de amortiguadores.',
    fullDesc: 'Revisión y cambio de amortiguadores, copelas y brazos de suspensión para garantizar la estabilidad, adherencia y distancia óptima de frenado.',
    category: 'frenos_seguridad',
    icon: Activity
  },
  {
    id: 'escapes',
    title: 'Escapes',
    shortDesc: 'Revisión y cambio de Tubos de Escape, Catalizadores, y Filtro de Partículas.',
    fullDesc: 'Revisión y cambio de Tubos de Escape, Catalizadores, y Filtro de Partículas (DPF/FAP). Reparación de fugas y control de emisiones para superar la ITV.',
    category: 'mecanica_motor',
    icon: Wind
  },
  {
    id: 'motores',
    title: 'Motores',
    shortDesc: 'Rectificación y reparación de motores, juntas de culata, válvulas, turbocompresores, etc.',
    fullDesc: 'Rectificación y reparación integral de motores gasolina y diésel: juntas de culata, válvulas, turbocompresores, kit de distribución y bombas de agua.',
    category: 'mecanica_motor',
    icon: Car
  },
  {
    id: 'puesta-a-punto',
    title: 'Puesta a Punto',
    shortDesc: 'Puesta a punto general del vehículo.',
    fullDesc: 'Puesta a punto general del vehículo: niveles de fluidos, bujías/calentadores, correas auxiliares, presiones de neumáticos, alumbrado y puntos clave.',
    category: 'itv_mantenimiento',
    icon: Sparkles
  },
  {
    id: 'accesorios',
    title: 'Accesorios',
    shortDesc: 'Montaje de accesorios del automóvil.',
    fullDesc: 'Montaje e instalación profesional de accesorios del automóvil: bolas de enganche homologadas, iluminación LED/xenón, audio multimedia, sensores y cámaras.',
    category: 'electronica_clima',
    icon: Gauge
  },
  {
    id: 'inyeccion',
    title: 'Inyección',
    shortDesc: 'Sistemas de inyección electrónicas y mecánicas.',
    fullDesc: 'Comprobación, calibración y reparación de sistemas de inyección electrónicas y mecánicas, common rail, bombas inyectoras, toberas y rampas de inyección.',
    category: 'mecanica_motor',
    icon: Cpu
  },
  {
    id: 'diagnosis',
    title: 'Diagnosis',
    shortDesc: 'Contamos con sistemas de diagnosis con equipos de última generación.',
    fullDesc: 'Contamos con sistemas de diagnosis con equipos de última generación multimarca. Lectura e interpretación de códigos OBD, diagnosis de testigos de avería y análisis en tiempo real.',
    category: 'electronica_clima',
    icon: Cpu
  },
  {
    id: 'alineacion',
    title: 'Alineación',
    shortDesc: 'Alineación de direcciones integrales (convergencia, divergencia, caídas verticales, etc.).',
    fullDesc: 'Alineación de direcciones integrales (convergencia, divergencia, caídas verticales, etc.) por ordenador con medición láser para un rodaje suave y desgaste homogéneo.',
    category: 'frenos_seguridad',
    icon: Gauge
  },
  {
    id: 'airbag',
    title: 'Airbag',
    shortDesc: 'Revisión, reparación, y mantenimiento completo de todo el sistema.',
    fullDesc: 'Revisión, reparación y mantenimiento completo de todo el sistema de seguridad pasiva (airbags, pretensores pirotécnicos, sensores de impacto y centralitas SRS).',
    category: 'frenos_seguridad',
    icon: ShieldCheck
  },
  {
    id: 'electronica',
    title: 'Electrónica',
    shortDesc: 'Reparación y mantenimiento con equipos de diagnosis. Reparación de centralitas. Reseteado averias y puesta a cero contadores de revisión)',
    fullDesc: 'Reparación y mantenimiento con equipos de diagnosis. Reparación de centralitas. Reseteado de averías y puesta a cero de contadores de revisión e intervalos de servicio.',
    category: 'electronica_clima',
    icon: Cpu
  },
  {
    id: 'electricidad',
    title: 'Electricidad',
    shortDesc: 'Localización y reparación de averías en general. Alternadores, motores de arranque, etc.',
    fullDesc: 'Localización y reparación de averías eléctricas en general: alternadores, motores de arranque, baterías, cableados, fusibles y consumos residuales.',
    category: 'electronica_clima',
    icon: Zap
  },
  {
    id: 'cajas-de-cambios',
    title: 'Cajas de Cambios y Embragues',
    shortDesc: 'Reparación y sustitución de cajas de cambio manuales y automáticas. Mantenimiento de las mismas.',
    fullDesc: 'Reparación y sustitución de cajas de cambio manuales y automáticas. Mantenimiento de las mismas (valvulinas, aceite ATF y filtros), sustitución de embragues y volante bimasa.',
    category: 'mecanica_motor',
    icon: Disc
  },
  {
    id: 'revisiones',
    title: 'Revisiones',
    shortDesc: 'Revisiones de mantenimiento con 30 puntos de control manteniendo la garantía oficial según Reglamento Europeo 461/2010.',
    fullDesc: 'Realizamos las revisiones de mantenimiento de su vehículo nuevo, estando en garantía y sin que esta se pierda REGLAMENTO EUROPEO 461/2010 (Las operaciones de mantenimiento y las de reparación no cubiertas por la garantía del vehículo que se realicen durante el periodo de garantía del mismo por talleres no oficiales de la marca, no suponen la perdida de la garantía del fabricante, siempre y cuando se realicen siguiendo las instrucciones del fabricante y se empleen materiales originales o de calidad equivalente). Sustituciòn correas de distribución, revisiones con 30 puntos de control.',
    category: 'itv_mantenimiento',
    icon: ClipboardCheck,
    hasLegalGuarantee: true
  },
  {
    id: 'climatizacion',
    title: 'Climatización',
    shortDesc: 'Reparación y montaje de equipos de climatizacìon y aire acondicionado. Cargas de aire acondicionado con revisión de todo el sistema (presiones, estanqueidad del circuito, temperaturas, etc.)',
    fullDesc: 'Reparación y montaje de equipos de climatización y aire acondicionado. Cargas de gas refrigerante con revisión integral de todo el sistema (presiones, estanqueidad del circuito, temperaturas, etc.).',
    category: 'electronica_clima',
    icon: Wind
  },
  {
    id: 'mecanica-general',
    title: 'Mecánica General & Averías',
    shortDesc: 'Diagnóstico general, ruidos anómalos o presupuesto para cualquier necesidad mecánica.',
    fullDesc: 'Revisión y diagnóstico en elevador para cualquier fallo, ruido mecánico, pérdida de líquidos o consulta técnica previa.',
    category: 'mecanica_motor',
    icon: Wrench
  }
];

const SERVICE_CATEGORIES = [
  { id: 'all', label: 'Todos los Servicios' },
  { id: 'itv_mantenimiento', label: 'Pre-ITV & Mantenimiento' },
  { id: 'frenos_seguridad', label: 'Frenos & Seguridad' },
  { id: 'mecanica_motor', label: 'Mecánica & Motor' },
  { id: 'electronica_clima', label: 'Electrónica & Clima' }
];

const MORNING_HOURS = ['08:30', '09:30', '10:30', '11:30', '12:30'];
const AFTERNOON_HOURS = ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

const generateDefaultWeekdays = (count = 14) => {
  const days = [];
  const d = new Date();
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Skip Saturday and Sunday
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      days.push({
        date: dateStr,
        status: 'available',
        available_slots: 5
      });
    }
  }
  return days;
};

const DEFAULT_DAYS = generateDefaultWeekdays(14);

function App() {
  const [settings, setSettings] = useState({
    shop_name: 'Auto Talleres Romo',
    whatsapp_number: '34934620254',
    opening_hours: 'Lunes a Viernes 08:30 - 13:00 / 15:00 - 18:30'
  });

  const [calendarDays, setCalendarDays] = useState(DEFAULT_DAYS);
  const [loadingDates, setLoadingDates] = useState(false);

  // Form State
  const [selectedService, setSelectedService] = useState('pre-itv');
  const [customServiceText, setCustomServiceText] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [expandedLegalService, setExpandedLegalService] = useState(null);

  // Cookies State
  const [cookieConsent, setCookieConsent] = useState(() => {
    return localStorage.getItem('autoromo_cookie_consent') === 'true';
  });
  const [showCookieModal, setShowCookieModal] = useState(false);

  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => DEFAULT_DAYS[0]?.date || '');
  const [selectedTime, setSelectedTime] = useState('09:30');
  
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
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
        const setRes = await fetch(`${API_BASE}/api/settings`).catch(() => null);
        if (setRes && setRes.ok) {
          const setData = await setRes.json().catch(() => ({}));
          setSettings(prev => ({ ...prev, ...setData }));
        }

        // Fetch calendar overview for the next 25 days
        const today = new Date();
        const startStr = today.toISOString().split('T')[0];
        const future = new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000);
        const endStr = future.toISOString().split('T')[0];

        const overviewRes = await fetch(`${API_BASE}/api/calendar-overview?start=${startStr}&end=${endStr}`).catch(() => null);
        if (overviewRes && overviewRes.ok) {
          const overviewData = await overviewRes.json().catch(() => []);
          const weekdays = overviewData.filter(d => d.status !== 'weekend');
          if (weekdays.length > 0) {
            setCalendarDays(weekdays);
            const firstAvail = weekdays.find(d => d.status === 'available');
            if (firstAvail) {
              setSelectedDate(firstAvail.date);
            } else {
              setSelectedDate(weekdays[0].date);
            }
          }
        }
      } catch (err) {
        console.warn('Backend unavailable, using default calendar availability:', err);
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

  const filteredServices = useMemo(() => {
    return SERVICES_CATALOG.filter((svc) => {
      const matchesCat = activeCategory === 'all' || svc.category === activeCategory;
      const q = serviceSearch.trim().toLowerCase();
      const matchesQuery = !q || 
        svc.title.toLowerCase().includes(q) || 
        svc.shortDesc.toLowerCase().includes(q) ||
        (svc.fullDesc && svc.fullDesc.toLowerCase().includes(q)) ||
        svc.badge.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [activeCategory, serviceSearch]);

  const handleAcceptCookies = () => {
    localStorage.setItem('autoromo_cookie_consent', 'true');
    setCookieConsent(true);
  };

  const directWhatsAppUrl = useMemo(() => {
    const rawWhatsApp = (settings.whatsapp_number || '34934620254').replace(/\D/g, '');
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
      email: clientEmail.trim(),
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
      const rawWhatsApp = (settings.whatsapp_number || '34934620254').replace(/\D/g, '');
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
      console.warn('Backend offline, completing booking with direct WhatsApp message:', err);
      const rawWhatsApp = (settings.whatsapp_number || '34934620254').replace(/\D/g, '');
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
        ...payload,
        isAutoApproved: true,
        isWaitingList: isWaitingListMode,
        whatsappUrl,
        formattedDate: selectedDate,
        formattedTime: selectedTime
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      'LOCATION:Auto Talleres Romo, Carretera de Mataró, 111, 08930 Sant Adrià de Besòs (Barcelona)',
      `DTSTART:${toICSDate(dt)}`,
      `DTEND:${toICSDate(endDt)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Cita-Auto-Talleres-Romo-${submittedAppointment.formattedDate || 'reserva'}.ics`);
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
                  Multimarca · Sant Adrià
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Carretera de Mataró, 111, 08930 · Sant Adrià de Besòs
              </p>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[11px] text-slate-500 flex items-center justify-end gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Horario: 08:30-13:00 / 15:00-18:30
              </span>
              <a 
                href="tel:934620254" 
                className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" /> 93 462 02 54
              </a>
            </div>

            <a
              href="tel:934620254"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-300 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>93 462 02 54</span>
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
                    ? '¡Solicitud en Lista de Espera Registrada!' 
                    : '¡Cita Aceptada y Confirmada!'}
                </h1>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {submittedAppointment.isWaitingList
                    ? `Este día está actualmente completo o cerrado. Hemos guardado tus datos con máxima prioridad y te contactaremos por WhatsApp o teléfono en breve en cuanto tengamos un hueco disponible.`
                    : `Tu cita ha sido registrada y aceptada en el sistema del taller. Te esperamos el ${submittedAppointment.formattedDate} a las ${submittedAppointment.formattedTime} h en Auto Talleres Romo (Carretera de Mataró, 111, Sant Adrià de Besòs).`}
                </p>
              </div>

              {/* Appointment Ticket Card */}
              <div className="bg-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de la Reserva</span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                    submittedAppointment.isWaitingList 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {submittedAppointment.isWaitingList ? '⏳ Lista de Espera (Aviso en Breve)' : '✓ Aceptada y Confirmada'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Titular de la Cita</span>
                    <span className="font-bold text-slate-900">{submittedAppointment.name}</span>
                    <span className="text-xs text-slate-600 block mt-0.5 font-medium">📱 {submittedAppointment.phone}</span>
                      {submittedAppointment.email && (
                        <span className="text-xs text-blue-700 block mt-0.5 font-semibold">✉️ {submittedAppointment.email}</span>
                      )}
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
                    <strong>Indicaciones de Auto Talleres Romo:</strong> Si te surge cualquier consulta, modificación o urgencia, llámanos directamente al <strong>93 462 02 54</strong> o escríbenos por WhatsApp. Estamos en Carretera de Mataró, 111, Sant Adrià de Besòs.
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
                <span>Gestión de Cita Previa Oficial · Sant Adrià de Besòs</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                Reserva cita para tu vehículo en <span className="text-blue-600">Auto Talleres Romo</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                Mantenimiento oficial multimarca, diagnosis electrónica avanzada, ITV, neumáticos y mecánica en Sant Adrià de Besòs. Confirmación inmediata sin esperas.
              </p>
            </div>

            {/* 3 Trust Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-5xl mx-auto">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
                <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Confirmación Directa</span>
                  <span className="text-[11px] text-slate-500 block">Horario y citas en tiempo real</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
                <ClipboardCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Pre-ITV Homologada</span>
                  <span className="text-[11px] text-slate-500 block">Equipos homologados para ITV</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Garantía Oficial Fabricante</span>
                  <span className="text-[11px] text-slate-500 block">Reglamento Europeo 461/2010</span>
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
                        <h2 className="text-lg font-bold text-slate-900 font-display">Nuestros Servicios Multimarca</h2>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">18 opciones disponibles</span>
                    </div>

                    {/* Category Filter Pills & Search */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {SERVICE_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              activeCategory === cat.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* Quick Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o descripción (ej. Pre-ITV, frenos, aceite, diagnosis, clima, airbag...)"
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                        />
                        {serviceSearch && (
                          <button
                            type="button"
                            onClick={() => setServiceSearch('')}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Services Grid */}
                    {filteredServices.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                        <p className="font-semibold text-slate-700">No se encontraron servicios que coincidan con &quot;{serviceSearch}&quot;</p>
                        <p className="mt-1 text-slate-400">Puedes restablecer los filtros o describir tu problema abajo en el campo de texto libre.</p>
                        <button
                          type="button"
                          onClick={() => { setServiceSearch(''); setActiveCategory('all'); }}
                          className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Ver todos los servicios
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {filteredServices.map((svc) => {
                          const IconComp = svc.icon;
                          const isSelected = selectedService === svc.id;
                          return (
                            <div
                              key={svc.id}
                              onClick={() => setSelectedService(svc.id)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  {svc.isHomologated && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Homologado ITV
                                    </span>
                                  )}
                                  {svc.hasLegalGuarantee && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                      Garantía Reg. 461/2010
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2.5">
                                  <span className={`text-xs font-bold block ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                                    {svc.title}
                                  </span>
                                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                    {svc.shortDesc}
                                  </p>
                                </div>
                              </div>

                              {/* Special Legal/Homologation Highlights */}
                              {svc.id === 'revisiones' && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                    Mantienes la Garantía Oficial de Fábrica (Reg. 461/2010)
                                  </span>
                                </div>
                              )}

                              {svc.id === 'pre-itv' && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    <ClipboardCheck className="w-3 h-3 text-emerald-600" />
                                    Línea de revisión homologada para centros de ITV
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Dedicated Client Issue Box (Always Visible) */}
                    <div className="pt-4 border-t border-slate-100 space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Describe el problema, avería o detalles del trabajo (Opcional):</span>
                        <span className="text-[11px] text-slate-400 font-normal">Síntomas, ruidos, testigos...</span>
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Ej. Cambio de aceite y filtro + revisión pre-itv, testigo de motor encendido en frío..."
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
                          Puedes escribirnos por WhatsApp o llamarnos directamente al <strong>93 462 02 54</strong>.
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
                                <span className="text-[11px] uppercase font-bold tracking-wider block opacity-75">
                                  {dayName}
                                </span>
                                <span className="text-xl font-extrabold block my-0.5">
                                  {dayNum}
                                </span>
                                <span className="text-xs capitalize block opacity-75 font-semibold">
                                  {monthName}
                                </span>
                                
                                {isBlockedOrFull && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1.5 block truncate ${
                                    isSelected ? 'bg-white/25 text-white' : 'bg-amber-200/90 text-amber-950'
                                  }`}>
                                    ⏳ Lista Espera
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
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

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-800">Correo Electrónico (para Confirmación de Cita) *</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            required
                            placeholder="Ej. carlos.martinez@gmail.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none placeholder:text-slate-400 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-slate-800">Observaciones o Síntomas Adicionales (Opcional)</label>
                      <textarea
                        rows="2"
                        placeholder="Ej. Dejar vehículo antes de ir al trabajo, solicitud de presupuesto previo..."
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
                    Atención al cliente: <strong>93 462 02 54</strong>. Lunes a viernes de 08:30 a 13:00 y 15:00 a 18:30 h.
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
                      href="tel:934620254"
                      className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-all shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Llamar al taller: 93 462 02 54</span>
                    </a>
                  </div>
                </div>

              </div>

            </div>

            {/* Workshop Facilities & Trust Showcase */}
            <div className="pt-12 border-t border-slate-200 max-w-6xl mx-auto space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 font-display">Taller Mecánico en Sant Adrià de Besòs — Auto Talleres Romo</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
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
                    Carretera de Mataró, 111, 08930 Sant Adrià de Besòs (Barcelona)
                  </p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Situados junto a los accesos principales de Sant Adrià y Ronda Litoral. Fácil acceso y aparcamiento para clientes.
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

                <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    📞
                  </div>
                  <span className="font-bold text-sm text-slate-900 block">Atención & Contacto</span>
                  <p className="text-slate-900 font-bold text-xs">
                    Teléfono: 93 462 02 54
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Atención directa, presupuesto previo claro y sin sorpresas.
                  </p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Especialistas multimarca para turismos, furgonetas y vehículos comerciales.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                    🕒
                  </div>
                  <span className="font-bold text-sm text-slate-900 block">Horario de Atención</span>
                  <p className="text-slate-700 leading-relaxed font-semibold">
                    Mañanas: 08:30 a 13:00 h<br />
                    Tardes: 15:00 a 18:30 h
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    De lunes a viernes. Recepción y entrega de vehículos en taller.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Modern Workshop Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{settings.shop_name || 'Auto Talleres Romo'}</span>
              <span>— Taller Mecánico Multimarca (Sant Adrià de Besòs)</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-center sm:text-right">
              <span>Carretera de Mataró, 111, 08930 Sant Adrià de Besòs (Barcelona)</span>
              <span>Tel: 93 462 02 54</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Auto Talleres Romo. Todos los derechos reservados.</span>
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => setShowCookieModal(true)} 
                className="hover:text-slate-600 transition-colors cursor-pointer"
              >
                Política de Cookies
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a
        href={directWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-600/40 flex items-center gap-2 border border-emerald-400/40 transition-all hover:scale-105 group"
        title="Consultar por WhatsApp con el taller"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="hidden sm:inline text-xs font-bold pr-1">WhatsApp Taller</span>
      </a>

      {/* Official Cookies Consent Banner */}
      {!cookieConsent && (
        <aside 
          aria-label="Aviso sobre cookies"
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-5 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-700/80 shadow-2xl animate-fade-in"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-slate-200 leading-relaxed">
                Este sitio web utiliza cookies técnicas para garantizar el correcto funcionamiento de la solicitud de cita previa y mejorar tu experiencia de navegación.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleAcceptCookies}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
              >
                ACEPTAR
              </button>
              <button
                type="button"
                onClick={() => setShowCookieModal(true)}
                className="text-slate-300 hover:text-white underline font-semibold text-xs transition-colors cursor-pointer"
              >
                Más información
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Cookies Modal Dialog */}
      {showCookieModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Política de Cookies — Auto Talleres Romo</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCookieModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>¿Qué son las cookies?</strong><br />
                Una cookie es un pequeño fichero que se descarga en su equipo al acceder a determinadas páginas web. Permite a una página web recordar información de navegación.
              </p>
              <p>
                <strong>Uso de cookies en Auto Talleres Romo:</strong><br />
                Auto Talleres Romo utiliza únicamente cookies técnicas esenciales para gestionar la cita previa en línea, recordar los datos del vehículo y garantizar una comunicación ágil con el taller.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  handleAcceptCookies();
                  setShowCookieModal(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Aceptar Cookies
              </button>
              <button
                type="button"
                onClick={() => setShowCookieModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
