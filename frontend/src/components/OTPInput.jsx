import React, { useRef, useState, useEffect } from 'react';

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
    <div className="flex gap-2 sm:gap-3 lg:gap-4 justify-center py-4 overflow-x-auto no-scrollbar">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          ref={(el) => (inputs.current[index] = el)}
          value={data}
          disabled={disabled}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-10 h-14 sm:w-12 sm:h-16 text-center text-xl font-black bg-slate-900/50 border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all shadow-inner disabled:opacity-30"
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}
