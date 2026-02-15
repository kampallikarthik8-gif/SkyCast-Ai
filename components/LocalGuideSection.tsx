
import React from 'react';
import { LocalGuide } from '../types';

interface LocalGuideSectionProps {
  guide: LocalGuide;
  loading: boolean;
}

const LocalGuideSection: React.FC<LocalGuideSectionProps> = ({ guide, loading }) => {
  if (loading) {
    return (
      <div className="glass p-8 rounded-[40px] animate-pulse h-64 flex flex-col justify-center items-center text-center">
        <div className="w-12 h-12 bg-white/10 rounded-full mb-4 animate-bounce"></div>
        <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Finding nearby gems...</p>
      </div>
    );
  }

  if (guide.places.length === 0) return null;

  return (
    <div className="glass p-8 rounded-[40px] relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Local Guide</span>
          <span className="text-white/30 text-xs">• Powered by Google Maps</span>
        </div>
        
        <p className="text-white/80 leading-relaxed mb-8 font-medium">
          {guide.recommendation}
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {guide.places.map((place, i) => (
            <a 
              key={i}
              href={place.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-blue-400/30 transition-all group/place"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Nearby Spot</span>
                <svg className="w-4 h-4 text-white/20 group-hover/place:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white group-hover/place:text-blue-100">{place.name}</span>
              <span className="text-xs text-white/40 mt-1">View on Google Maps</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocalGuideSection;
