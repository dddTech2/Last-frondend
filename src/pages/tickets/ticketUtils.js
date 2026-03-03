// src/pages/tickets/ticketUtils.js
import { Bug, Star, AlertCircle, AlertTriangle, ArrowUpCircle, Info } from "lucide-react";

export const STATUS_MAP = {
  Abierto: { label: "Abierto", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ABIERTO: { label: "Abierto", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "En Progreso": { label: "En Progreso", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  EN_PROGRESO: { label: "En Progreso", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  Resuelto: { label: "Resuelto", color: "bg-green-100 text-green-800 border-green-200" },
  RESUELTO: { label: "Resuelto", color: "bg-green-100 text-green-800 border-green-200" },
  Cerrado: { label: "Cerrado", color: "bg-gray-100 text-gray-800 border-gray-200" },
  CERRADO: { label: "Cerrado", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

export const PRIORITY_MAP = {
  Baja: { label: "Baja", color: "bg-slate-100 text-slate-800 border-slate-200", icon: Info },
  BAJA: { label: "Baja", color: "bg-slate-100 text-slate-800 border-slate-200", icon: Info },
  Media: { label: "Media", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: ArrowUpCircle },
  MEDIA: { label: "Media", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: ArrowUpCircle },
  Alta: { label: "Alta", color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle },
  ALTA: { label: "Alta", color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle },
  Crítica: { label: "Crítica", color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
  Critica: { label: "Crítica", color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
  CRITICA: { label: "Crítica", color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
};

export const TYPE_MAP = {
  Falla: { label: "Falla", color: "bg-red-100 text-red-800 border-red-200", icon: Bug },
  FALLA: { label: "Falla", color: "bg-red-100 text-red-800 border-red-200", icon: Bug },
  "Solicitud de Mejora": { label: "Mejora", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Star },
  SOLICITUD_MEJORA: { label: "Mejora", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Star },
};

export const MODULE_OPTIONS = [
  { value: "COMUNICACIONES", label: "Módulo de comunicaciones" },
  { value: "CHAT_WHATSAPP", label: "Módulo de chat de whatsapp" },
  { value: "EMPLEADOS", label: "Módulo de empleados" },
  { value: "CAMPANAS", label: "Módulo de campañas masivas" },
  { value: "REPORTES", label: "Módulo de reportes" },
  { value: "RAG", label: "Modelo de RAG" },
];

export const STATUS_OPTIONS = [
  { value: "ABIERTO", label: "Abierto" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "RESUELTO", label: "Resuelto" },
  { value: "CERRADO", label: "Cerrado" },
];

export const PRIORITY_OPTIONS = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

export const TYPE_OPTIONS = [
  { value: "FALLA", label: "Falla" },
  { value: "SOLICITUD_MEJORA", label: "Solicitud de Mejora" },
];

export const isTechOrAdmin = (userRoles = []) => {
  return userRoles.some(r => ["Admin", "Super Administrador", "Tecnologia", "Tecnología"].includes(r));
};
