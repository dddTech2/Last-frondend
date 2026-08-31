import React from 'react';

const QuickAccessCard = ({ title, description, icon }) => {
  return (
    <div className="group relative cursor-pointer overflow-hidden bg-white/80 p-5 rounded-2xl shadow-xs backdrop-blur-sm border border-gray-100/80 hover:border-gray-200 transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] hover:bg-white h-full flex flex-col justify-center">
      <div className="flex items-center gap-3.5">
        {/* Icon Container */}
        <div className="flex-shrink-0">
          {icon}
        </div>
        {/* Title */}
        <h3 className="text-sm font-bold text-gray-800 leading-snug">
          {title}
        </h3>
      </div>
      {/* Description - appears on hover */}
      <div className="overflow-hidden max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-2.5 transition-all duration-300 ease-in-out">
        <p className="text-gray-500 text-xs leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default QuickAccessCard;
