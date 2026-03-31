import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function OTPInput({ value, onChange, disabled }) {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const inputs = useRef([]);

  useEffect(() => {
    if (!value) {
      setOtp(new Array(6).fill(''));
    }
  }, [value]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    if (element.value !== '' && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex gap-2.5 sm:gap-4 justify-center py-4">
      {otp.map((data, index) => (
        <motion.input
          key={index}
          type="text"
          maxLength={1}
          ref={(el) => (inputs.current[index] = el)}
          value={data}
          disabled={disabled}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="w-10 h-14 sm:w-12 sm:h-16 text-center text-xl font-black bg-slate-900 border border-white/[0.05] rounded-[1rem] text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner disabled:opacity-30"
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}
