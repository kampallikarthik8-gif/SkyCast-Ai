
import React from 'react';
import { AIInsight } from '../types';

interface AIInsightsProps {
  insight: AIInsight;
  loading: boolean;
}

const AIInsights: React.FC<AIInsightsProps> = ({ insight, loading }) => {
  if (loading) {
    return (
      <div className="glass p-6 rounded-3xl animate-pulse">
        <div className="flex justify-between mb-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="h-10 w-10 bg-white/10 rounded-full"></div>
        </div>
        <div className="h-12 bg-white/10 rounded w-full mb-4"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  // Determine vibe color
  const getVibeColor = (score: number) => {
    if (score > 80) return 'text-emerald-400';
    if (score > 50) return 'text-blue-400';
    if (score > 30) return 'text-yellow-400';
    return 'text-rose-400';
  };

  return (
    <div className="glass p-8 rounded-[40px] relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-500">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="relative">
          <svg className="w-24 h-24 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-blue-500/20 shadow-sm">AI Analysis</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`text-3xl font-black ${getVibeColor(insight.vibeScore)} drop-shadow-lg`}>
              {insight.vibeScore}
            </div>
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Vibe Score</span>
          </div>
        </div>
        
        <p className="text-2xl font-semibold text-white leading-tight mb-8">
          {insight.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Clothing Strategy</h4>
            <div className="flex flex-wrap gap-2">
              {insight.clothing.map((item, i) => (
                <span key={i} className="bg-white/10 border border-white/5 px-4 py-2 rounded-2xl text-xs font-medium text-white/90 hover:bg-white/20 transition-colors">{item}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Suggested Pursuits</h4>
            <div className="flex flex-wrap gap-2">
              {insight.activities.map((act, i) => (
                <span key={i} className="bg-blue-400/10 border border-blue-400/20 text-blue-200 px-4 py-2 rounded-2xl text-xs font-medium hover:bg-blue-400/20 transition-colors">{act}</span>
              ))}
            </div>
          </div>
        </div>

        {insight.bestTimeFor && insight.bestTimeFor.length > 0 && (
          <div className="pt-6 border-t border-white/5">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">The Smart Schedule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {insight.bestTimeFor.map((item, i) => (
                <div key={i} className="bg-black/20 p-4 rounded-[24px] border border-white/5 hover:border-blue-400/30 transition-all group/schedule">
                  <div className="text-[10px] font-black text-blue-400/60 uppercase tracking-wider mb-1 group-hover/schedule:text-blue-400">{item.time}</div>
                  <div className="text-sm font-bold text-white/90">{item.activity}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
