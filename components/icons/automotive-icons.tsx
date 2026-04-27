import React from 'react'

/**
 * Premium, high-precision automotive silhouettes based on the provided industry reference.
 * These icons are designed to be bold, solid, and unmistakable for automotive professionals.
 */

// Piston Silhouette (Engine)
export const PistonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18 10V4a2 2 0 00-2-2H8a2 2 0 00-2 2v6c-1.1 0-2 .9-2 2v2a2 2 0 002 2h1v1.5a3.5 3.5 0 007 0V16h1a2 2 0 002-2v-2c0-1.1-.9-2-2-2zM8 4h8v2H8V4zm0 3h8v1H8V7zm0 2h8v1H8V9zm4 11.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
  </svg>
)

// Interlocking Gears Silhouette (Transmission)
export const GearsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11 11.5c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5v-1z" opacity=".3" />
    <path d="M22 12c0-.5-.1-.9-.2-1.4l1.9-1.5c.2-.2.3-.5.1-.7L21.3 5c-.1-.2-.4-.3-.7-.2l-2.4 1c-.8-.7-1.7-1.2-2.7-1.5l-.4-2.5c0-.2-.2-.4-.5-.4h-5.2c-.3 0-.5.2-.5.4l-.4 2.5c-1 .3-1.9.8-2.7 1.5l-2.4-1c-.3-.1-.6 0-.7.2L.9 8.4c-.1.2-.1.5.1.7l1.9 1.5c-.1.5-.2.9-.2 1.4s.1.9.2 1.4L1 14.9c-.2.2-.3.5-.1.7L3.4 19c.1.2.4.3.7.2l2.4-1c.8.7 1.7 1.2 2.7 1.5l.4 2.5c0 .2.2.4.5.4h5.2c.3 0 .5-.2.5-.4l.4-2.5c1-.3 1.9-.8 2.7-1.5l2.4 1c.3.1.6 0 .7-.2l2.5-3.4c.1-.2.1-.5-.1-.7l-1.9-1.5c.1-.5.2-.9.2-1.4zM12 16.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
  </svg>
)

// Shock Absorber Silhouette (Suspension/Chassis)
export const SuspensionIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M15 2h-6c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1z" />
    <rect x="11" y="6" width="2" height="14" />
    <path d="M8 8h1v1H8V8zm0 2h1v1H8v-1zm0 2h1v1H8v-1zm0 2h1v1H8v-1zm0 2h1v1H8v-1zm7-8h1v1h-1V8zm0 2h1v1h-1v-1zm0 2h1v1h-1v-1zm0 2h1v1h-1v-1zm0 2h1v1h-1v-1z" />
    <path d="M7 7h10v13c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2V7zm2 2v9h6V9H9z" opacity=".2" />
    <path d="M13 22h-2c-1.1 0-2-.9-2-2v-1h6v1c0 1.1-.9 2-2 2z" />
  </svg>
)

// Car Battery Silhouette (Electrical)
export const BatteryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21 7h-3V4c0-.6-.4-1-1-1h-3c-.6 0-1 .4-1 1v3H9V4c0-.6-.4-1-1-1H5c-.6 0-1 .4-1 1v3H2c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h19c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM8 15H5v-2h3v2zm11 0h-5v-2h5v2z" />
  </svg>
)

// Car Front Silhouette (Body/Painting)
export const CarFrontIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21 11l-1.5-4.5A3.5 3.5 0 0016 4H8c-1.5 0-3 1-3.5 2.5L3 11c-1.2 0-2 1-2 2.2V19c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h14v1c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-5.8c0-1.2-.8-2.2-2-2.2zM7 16a2 2 0 110-4 2 2 0 010 4zm10 0a2 2 0 110-4 2 2 0 010 4z" />
    <rect x="8" y="7" width="8" height="3" rx="1" fill="white" opacity=".3" />
  </svg>
)

// Towing Truck Silhouette (Towing)
export const TowingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23 15l-5-5v3h-5l-3-3H1v8h21v-3h1zm-17 4a2 2 0 110-4 2 2 0 010 4zm11-4a2 2 0 110 4 2 2 0 010-4z" />
  </svg>
)

// Differential Axle Silhouette (Under Chassis)
export const DifferentialIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 11h-4.5c-.3-2.5-2.5-4.5-5-4.5s-4.7 2-5 4.5H2v2h5.5c.3 2.5 2.5 4.5 5 4.5s4.7-2 5-4.5H22v-2zM12.5 15c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" />
    <circle cx="12.5" cy="12.5" r="1" fill="white" />
  </svg>
)

// Detailed Wheel/Tire (Detailing)
export const TireIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="8" fill="none" stroke="white" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="white" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="white" strokeWidth="1" />
  </svg>
)

// Professional Diagnostics (Overhaul)
export const DiagnosticsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20 4H4a2 2 0 00-2 2v10a2 2 0 002 2h4l-1 2h10l-1-2h4a2 2 0 002-2V6a2 2 0 00-2-2zm-1 10H5V6h14v8z" />
    <path d="M8 8h8v2H8zm0 3h5v1H8z" fill="white" />
  </svg>
)

// Oil Can Silhouette (Maintenance)
export const OilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21 12l-7-9h-2l-2 2v2l2 2v7h9v-4zM8 10v4c0 2.2 1.8 4 4 4h2l2-2v-4l-2-2h-4l-2 2z" />
    <circle cx="12" cy="18" r="1" fill="white" />
  </svg>
)

// Wrench & Piston Combo (Mechanical)
export const WrenchPistonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17 10h-1V3a1 1 0 00-1-1H9a1 1 0 00-1 1v7H7a2 2 0 00-2 2v2a2 2 0 002 2h1v1.5a3.5 3.5 0 007 0V16h1a2 2 0 002-2v-2a2 2 0 00-2-2z" />
    <path d="M19.5 17.5l-3-3M16.5 14.5l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Detailing Silhouette (Car with Sparkles)
export const DetailingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.1 7.2L18.2 6a2 2 0 00-1.6-.8H7.4c-.6 0-1.2.3-1.6.8L4.9 7.2C3.2 7.7 2 9.2 2 11v4c0 .6.4 1 1 1h1v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h8v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h1c.6 0 1-.4 1-1v-4c0-1.8-1.2-3.3-2.9-3.8zM6.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    <path d="M12 2l.6 1.4L14 4l-1.4.6L12 6l-.6-1.4L10 4l1.4-.6L12 2zm7 0l.4 1 .9.4-1 .4-.4 1-.4-1-1-.4 1-.4.4-1zm-15 4l.4 1 .9.4-1 .4-.4 1-.4-1-1-.4 1-.4.4-1z" fill="white" />
  </svg>
)

// Chassis Silhouette (Fabrication)
export const ChassisIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21 9h-2V7c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v2H3c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1h2v2c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-2h2c.6 0 1-.4 1-1v-4c0-.6-.4-1-1-1zM7 7h10v2H7V7zm10 10H7v-2h10v2z" />
    <rect x="10" y="9" width="4" height="6" fill="white" opacity=".3" />
  </svg>
)

// Engine Block Silhouette (Overhaul)
export const EngineBlockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20 8h-2V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-8 10c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
    <path d="M7 6h10v2H7V6zM5 11h2v2H5v-2zm12 0h2v2h-2v-2z" fill="white" />
  </svg>
)

// Mechanic Silhouette (Trust Section)
export const MechanicIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C9.8 2 8 3.8 8 6v2h8V6c0-2.2-1.8-4-4-4zm4 8H8c-2.2 0-4 1.8-4 4v2c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4v-2c0-2.2-1.8-4-4-4z" />
    <path d="M12 11l-3 3h2v4h2v-4h2l-3-3z" fill="white" />
  </svg>
)
