"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  format: string; // e.g. "XX XX XX XX XX"
}

const countries: Country[] = [
  { code: "MA", name: "Morocco", flag: "🇲🇦", prefix: "+212", format: "XX XX XX XX XX" },
  { code: "FR", name: "France", flag: "🇫🇷", prefix: "+33", format: "X XX XX XX XX" },
  { code: "US", name: "USA", flag: "🇺🇸", prefix: "+1", format: "XXX XXX XXXX" },
  { code: "AE", name: "UAE", flag: "🇦🇪", prefix: "+971", format: "X XX XXX XXXX" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", prefix: "+966", format: "X XXX XXXX" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function PhoneInput({ value, onChange, required }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [localNumber, setLocalNumber] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial value if it contains a prefix
  useEffect(() => {
    if (value && !localNumber) {
      const country = countries.find(c => value.startsWith(c.prefix));
      if (country) {
        setSelectedCountry(country);
        const num = value.replace(country.prefix, "").trim();
        setLocalNumber(formatNumber(num, country.format));
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatNumber = (input: string, format: string) => {
    const digits = input.replace(/\D/g, "");
    let formatted = "";
    let digitIndex = 0;

    for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
      if (format[i] === "X") {
        formatted += digits[digitIndex];
        digitIndex++;
      } else {
        formatted += format[i];
      }
    }
    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatNumber(input, selectedCountry.format);
    setLocalNumber(formatted);
    
    // Send full international number to parent
    const cleanDigits = formatted.replace(/\D/g, "");
    onChange(`${selectedCountry.prefix}${cleanDigits}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        {/* Country Selector */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-white min-w-[100px]"
        >
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">{selectedCountry.prefix}</span>
          <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isOpen && "rotate-180")} />
        </button>

        {/* Input Field */}
        <input
          type="tel"
          required={required}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono tracking-wider"
          placeholder={selectedCountry.format.replace(/X/g, "0")}
          value={localNumber}
          onChange={handleInputChange}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 space-y-1">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  setSelectedCountry(country);
                  setIsOpen(false);
                  // Update parent with new prefix
                  const cleanDigits = localNumber.replace(/\D/g, "");
                  onChange(`${country.prefix}${cleanDigits}`);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors",
                  selectedCountry.code === country.code ? "bg-blue-600 text-white" : "hover:bg-white/5 text-slate-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-sm font-medium">{country.name}</span>
                </div>
                <span className={cn("text-xs font-bold", selectedCountry.code === country.code ? "text-blue-100" : "text-slate-500")}>
                  {country.prefix}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
