import React from 'react';

const colorClasses = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-600'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-600'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    icon: 'text-orange-600'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    icon: 'text-indigo-600'
  }
};

const CampaignStatsCard = ({ title, value, icon: Icon, color = 'blue', trend }) => {
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${colors.bg}`}>
            {Icon && <Icon className={`w-6 h-6 ${colors.icon}`} />}
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </h3>
        <p className="text-3xl font-bold text-gray-900 mb-2">
          {value}
        </p>
        {trend && (
          <p className={`text-sm font-medium ${colors.text}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default CampaignStatsCard;
