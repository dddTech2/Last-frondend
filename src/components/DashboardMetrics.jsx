import React, { useEffect, useState } from "react";
import * as api from "../services/api";

export default function DashboardMetrics() {
  const [stats, setStats] = useState({
    active_campaigns: 0,
    sent_messages_month: 0,
    delivery_rate: 0,
    next_scheduled: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const metrics = [
    {
      title: "Campañas Activas",
      value: stats.active_campaigns,
      icon: "💬",
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Mensajes Enviados (Mes)",
      value: stats.sent_messages_month.toLocaleString(),
      icon: "📈",
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Tasa de Entrega Promedio",
      value: `${stats.delivery_rate.toFixed(1)}%`,
      icon: "📬",
      color: "bg-purple-100 text-purple-700",
    },
    {
      title: "Próximas Programadas",
      value: stats.next_scheduled,
      icon: "📅",
      color: "bg-orange-100 text-orange-700",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center p-6 rounded-xl shadow-sm bg-gray-100 animate-pulse h-24">
            <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((m) => (
        <div
          key={m.title}
          className={`flex items-center p-6 rounded-xl shadow-sm ${m.color} transition hover:scale-105 duration-200`}
        >
          <span className="text-3xl mr-4">{m.icon}</span>
          <div>
            <div className="text-lg font-semibold">{m.title}</div>
            <div className="text-2xl font-bold">{m.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
