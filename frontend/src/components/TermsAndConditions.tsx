import React from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, Scale, ShieldAlert } from "lucide-react";

interface TermsAndConditionsProps {
  onBack: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onBack }) => {
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
        <span className="text-xs font-mono text-polar-400">POLAROPS LEGAL TERMS · MVP v1.0</span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
            DEMONSTRATION & PROTOTYPE LICENSE
          </span>
          <span className="text-xs font-mono text-polar-400">SIH 2026 · Problem Statement SIH26060</span>
        </div>
        <h1 className="text-2xl font-bold font-mono text-polar-100 tracking-tight">
          Terms of Use & Prototype Disclaimer
        </h1>
        <p className="text-sm text-polar-300 leading-relaxed">
          Please review the operational terms and safety boundaries governing use of the PolarOps Antarctic Operational Digital Twin demonstration software.
        </p>
      </div>

      {/* Core Operational Disclaimers */}
      <div className="p-4 rounded border border-amber-800/80 bg-amber-950/20 space-y-3">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider">
            Critical Notice: Decision-Support Demonstration Prototype
          </h2>
        </div>
        <p className="text-xs text-polar-300 leading-relaxed">
          PolarOps is an experimental software prototype designed to illustrate digital twin principles, dependency blast-radius modeling, and communication resilience for Antarctic facilities. It is <strong>NOT</strong> an accredited industrial SCADA actuator, life-support controller, or emergency dispatch system.
        </p>
      </div>

      {/* Detailed Articles */}
      <div className="space-y-6 text-sm text-polar-300 leading-relaxed border-t border-polar-800 pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">1. Nature of the Software</h2>
          <p className="text-xs text-polar-300">
            PolarOps is provided as an open research demonstration for Smart India Hackathon (SIH 2026). All station architectures, generator telemetry, fuel runway forecasts, and risk scores represent mathematical prototype models and synthetic datasets.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">2. No Autonomous Actuation or Physical Control</h2>
          <p className="text-xs text-polar-300">
            The software operates purely as an informational and analytical decision-support layer. It contains no mechanism for autonomous remote control, breaker actuation, generator start/stop sequences, or life-support valve manipulation. All operational recommendations require human evaluation and physical on-station execution.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">3. Non-Commercial Academic License</h2>
          <p className="text-xs text-polar-300">
            PolarOps source code, documentation, and assets are made available for technical review, academic evaluation, and hackathon judging. Unauthorized commercial resale or unverified deployment in mission-critical polar environments without institutional authorization is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">4. Disclaimer of Warranty & Liability</h2>
          <p className="text-xs text-polar-300">
            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR CONTRIBUTORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM THE USE OF THIS PROTOTYPE.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-mono font-bold text-polar-100">5. Project Governance & Provenance</h2>
          <p className="text-xs text-polar-300">
            For complete architectural documentation, data models, and test strategy, reference the project repository at{" "}
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
