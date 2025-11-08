import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CommunicationSlider = ({ slides, onSlideChange, autoplay = true, autoplayInterval = 5000 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(autoplay);

  useEffect(() => {
    if (!isAutoplayEnabled || slides.length <= 1) return;

    const interval = setInterval(() => {
      goToNextSlide();
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [currentSlide, isAutoplayEnabled, slides.length, autoplayInterval]);

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoplayEnabled(false);
    // Reactivar autoplay después de 10 segundos
    setTimeout(() => setIsAutoplayEnabled(autoplay), 10000);
  };

  useEffect(() => {
    onSlideChange?.(currentSlide);
  }, [currentSlide, onSlideChange]);

  if (slides.length === 0) {
    return <div className="text-center text-gray-500">No hay slides disponibles</div>;
  }

  return (
    <div className="w-full">
      {/* Slider Container */}
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Slides */}
        <div className="relative h-96 md:h-[500px]">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                index === currentSlide
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95'
              }`}
            >
              <div className="h-full flex flex-col md:flex-row">
                {/* Left Side - Text Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold w-fit">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      Paso {index + 1}
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                      {slide.title}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {slide.description}
                    </p>
                    {slide.items && (
                      <ul className="space-y-3 mt-6">
                        {slide.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                              {item.icon || '✓'}
                            </div>
                            <span className="text-gray-700">{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Right Side - Visual */}
                <div className="flex-1 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-8 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 400 400">
                      <circle cx="200" cy="200" r="150" fill="white" opacity="0.1" />
                      <circle cx="200" cy="200" r="100" fill="white" opacity="0.1" />
                    </svg>
                  </div>
                  <div className="relative z-10 text-white text-center">
                    {slide.icon && (
                      <div className="text-7xl mb-4 flex justify-center">
                        {slide.icon}
                      </div>
                    )}
                    {slide.visual && (
                      <div>{slide.visual}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevSlide}
              onMouseEnter={() => setIsAutoplayEnabled(false)}
              onMouseLeave={() => setIsAutoplayEnabled(autoplay)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white hover:bg-blue-600 text-blue-600 hover:text-white rounded-full p-2 transition-all shadow-lg"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNextSlide}
              onMouseEnter={() => setIsAutoplayEnabled(false)}
              onMouseLeave={() => setIsAutoplayEnabled(autoplay)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white hover:bg-blue-600 text-blue-600 hover:text-white rounded-full p-2 transition-all shadow-lg"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Progress Indicators (Dots) */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3">
            {slides.map((_, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => goToSlide(index)}
                  className={`transition-all rounded-full ${
                    index === currentSlide
                      ? 'bg-blue-600 h-3 w-8'
                      : 'bg-white border-2 border-blue-600 h-3 w-3 hover:w-5'
                  }`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Paso {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timer/Progress Bar at bottom */}
        {isAutoplayEnabled && slides.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all"
              style={{
                animation: `slideProgress ${autoplayInterval}ms linear`,
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideProgress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default CommunicationSlider;
