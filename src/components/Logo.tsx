"use client";

import Image from "next/image";
import { useState } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {!imageError ? (
          <Image
            src="/logo.png" // Place your logo file in public/logo.png
            alt="BAF Service"
            fill
            className="object-contain"
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
            BAF
          </div>
        )}
      </div>
    </div>
  );
}
