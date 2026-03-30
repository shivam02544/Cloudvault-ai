import React, { useRef, useState, useEffect } from 'react';

export default function OTPInput({ value, onChange, disabled }) {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const inputs = useRef([]);

  // Sync internal state if value prop changes externally (e.g. reset)
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

    // Move to next input if value is entered
    if (element.value !== '' && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pasteData.every(char => !isNaN(char))) {
      const newOtp = [...otp];
      pasteData.forEach((char, index) => {
        newOtp[index] = char;
        if (inputs.current[index]) {
          inputs.current[index].value = char;
        }
      });
      setOtp(newOtp);
      onChange(newOtp.join(''));
      
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(pasteData.length, 5);
      inputs.current[nextIndex].focus();
    }
  };

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
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
          className="w-10 h-12 text-center text-xl font-bold bg-slate-800/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}
