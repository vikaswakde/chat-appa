"use client";

import { cn } from "@/lib/utils";

interface ReadingTimeProps {
  text: string;
  wordsPerMinute?: number;
  className?: string;
}

export function ReadingTime({
  text,
  wordsPerMinute = 200,
  className,
}: ReadingTimeProps) {
  const calculateReadingTime = (text: string, wpm: number): string => {
    if (!text) return "0 min read";
    
    // Count words by splitting on whitespace
    const wordCount = text.trim().split(/\s+/).length;
    
    // Calculate time in minutes
    const minutes = Math.ceil(wordCount / wpm);
    
    return `${minutes} min read`;
  };

  const readingTime = calculateReadingTime(text, wordsPerMinute);

  return (
    <div className={cn("font-sans text-sm text-muted-foreground inline-flex items-center", className)}>
      {readingTime}
    </div>
  );
} 