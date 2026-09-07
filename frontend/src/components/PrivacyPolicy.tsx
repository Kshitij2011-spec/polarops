import React from "react";
import { ArrowLeft, ShieldCheck, Database, Lock, EyeOff } from "lucide-react";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150 py-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-polar-700 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-polar-300 hover:text-white px-3 py-1.5 rounded border border-polar-700 bg-polar-800 hover:bg-polar-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Command Center</span>
        </button>
        <span className="text-xs font-mono text-polar-400">POLAROPS LEGAL & DATA POLICY · MVP v1.0</span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-polar-800 text-accent-cyan border border-polar-700">
            TRANSPARENCY & DATA HONESTY
          </span>
          <span className="text-xs font-mono text-polar-400">Last updated: September 2026</span>
        </div>
        <h1 className="text-2xl font-bold font-mono text-polar-100 tracking-tight">
          PolarOps Privacy & Data Governance Statement
        </h1>
        <p className="text-sm text-polar-300 leading-relaxed">
          PolarOps is an engineering prototype and operational decision-support demonstration developed for Smart India Hackathon 2026 (Problem Statement SIH26060). This document provides an honest, factual description of our data handling practices.
        </p>
      </div>

      {/* Core Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded border border-polar-700 bg-polar-800/60 space-y-2">
          <div className="flex items-center gap-2 text-accent-cyan">
            <EyeOff className="h-4 w-4" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider">No Tracking or PII</h2>
          </div>
          <p className="text-xs text-polar-400 leading-relaxed">
            PolarOps does not collect, sell, or profile personal user information. No third-party tracking scripts, advertising pixels, or telemetry beacons are present.
          </p>
        </div>

        <div className="p-4 rounded border border-polar-700 bg-polar-800/60 space-y-2">
          <div className="flex items-center gap-2 text-accent-green">
            <Database className="h-4 w-4" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider">Synthetic Telemetry</h2>
          </div>
          <p className="text-xs text-polar-400 leading-relaxed">
            All station sensor streams, equipment temperatures, vibration values, and weather readings are deterministic synthetic datasets created solely for demonstration.
          </p>
        </div>

        <div className="p-4 rounded border border-polar-700 bg-polar-800/60 space-y-2">
          <div className="flex items-center gap-2 text-polar-200">
            <Lock className="h-4 w-4" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider">Local & Transient State</h2>
          </div>
          <p className="text-xs text-polar-400 leading-relaxed">
            Operator actions, simulation parameters, and what-if scenarios execute either in-memory or within an isolated demonstration database with zero external persistence.
          </p>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-6 text-sm text-polar-300 leading-relaxed border-t border-polar-800 pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">1. Information We Do Not Collect</h2>
          <p className="text-xs text-polar-300">
            The PolarOps MVP does not require user registration, account creation, email capture, or location tracking. We do not use persistent authentication cookies or device fingerprinting.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">2. Operational Simulation & Demonstration Data</h2>
          <p className="text-xs text-polar-300">
            Station assets, maintenance work orders, spare parts inventories, and scientific instrument readings are pre-seeded synthetic data. Actions performed during demonstration sessions (such as logging an incident action or triggering an offline outage simulation) update the demonstration environment only and can be reset at any time using the simulation reset control.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">3. Infrastructure & Hosting</h2>
          <p className="text-xs text-polar-300">
            The frontend user interface is hosted via Vercel edge networks, and the API service is deployed on Render infrastructure backed by PostgreSQL. Standard HTTP access logs (IP address, user agent, timestamp) may be temporarily retained by hosting providers for routine operational stability and DDoS mitigation in accordance with standard infrastructure operations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">4. Scientific & Institutional Boundaries</h2>
          <p className="text-xs text-polar-300">
            PolarOps is not currently connected to live NCPOR (National Centre for Polar and Ocean Research) secure communication networks, physical satellite modems, or station SCADA instrumentation. Future integration with operational polar facilities would be governed under strict governmental and scientific data protection agreements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">5. Contact & Inquiries</h2>
          <p className="text-xs text-polar-300">
            For questions regarding the PolarOps architecture or demonstration dataset, review the project repository at{" "}
            <a
              href="https://github.com/Kshitij2011-spec/polarops"
              target="_blank"
              rel="noreferrer"
              className="text-accent-cyan hover:underline font-mono"
            >
              github.com/Kshitij2011-spec/polarops
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};
