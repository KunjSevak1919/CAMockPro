"use client";

import { useState, useEffect } from "react";

type Props = {
  score: number;
  size?: "sm" | "lg";
};

function getColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f97316";
  return "#ef4444";
}

function getGrade(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Average";
  return "Needs Work";
}

export default function ScoreRing({ score, size = "sm" }: Props) {
  const diameter = size === "lg" ? 160 : 80;
  const strokeWidth = size === "lg" ? 8 : 6;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = diameter / 2;

  // Animate stroke on mount: start at 0%, then ease to target
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const offset = animated
    ? circumference - (score / 100) * circumference
    : circumference;

  const color = getColor(score);
  const grade = getGrade(score);

  // Font sizes scale with ring size
  const scoreFontSize = size === "lg" ? 38 : 19;
  const gradeFontSize = size === "lg" ? 14 : 9;
  const scoreY = size === "lg" ? center - 10 : center - 5;
  const gradeY = size === "lg" ? center + 20 : center + 10;

  return (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      aria-label={`Score: ${score} — ${grade}`}
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
      />
      {/* Score number */}
      <text
        x={center}
        y={scoreY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={scoreFontSize}
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
      {/* Grade label */}
      <text
        x={center}
        y={gradeY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={gradeFontSize}
        fill="#6b7280"
      >
        {grade}
      </text>
    </svg>
  );
}
