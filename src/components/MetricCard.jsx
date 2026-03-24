import React from 'react';

const MetricCard = ({ title, value, icon, subtitle }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
      <div className="mr-4 flex-shrink-0">
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <div className="flex items-baseline space-x-2 mt-1">
          <p className="text-2xl font-bold text-slate-800 truncate">{value}</p>
          {subtitle && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
