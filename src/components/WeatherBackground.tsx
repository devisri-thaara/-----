import { motion } from 'motion/react';
import React from 'react';

interface WeatherBackgroundProps {
  condition?: string;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ condition }) => {
  const getGradient = () => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunderstorm')) {
      return 'from-slate-900 via-blue-900 to-slate-800';
    }
    if (cond.includes('cloud')) {
      return 'from-blue-900 via-slate-800 to-blue-950';
    }
    if (cond.includes('clear')) {
      return 'from-blue-600 via-blue-800 to-indigo-950';
    }
    if (cond.includes('snow')) {
      return 'from-blue-100 via-blue-300 to-blue-500';
    }
    return 'from-blue-900 via-indigo-950 to-slate-950';
  };

  return (
    <div className={`fixed inset-0 -z-10 bg-gradient-to-br ${getGradient()} transition-colors duration-1000 overflow-hidden`}>
      {/* Animated blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          x: [0, -150, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-1/2 -right-20 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -bottom-20 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
      />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    </div>
  );
};
