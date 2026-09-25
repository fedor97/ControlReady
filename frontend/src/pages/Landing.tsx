import { useNavigate } from "react-router-dom";
import { useProgressStore } from "../state/progressStore";

export function Landing() {
  const navigate = useNavigate();
  const setStudentName = useProgressStore((s) => s.setStudentName);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--color-cr-panel-2),_var(--color-cr-bg))] px-6 text-center">
      <div className="font-mono-industrial text-3xl font-black tracking-tight text-cr-text">
        CONTROL<span className="text-cr-accent">READY</span>
      </div>
      <div className="mt-2 text-xs tracking-[0.3em] text-cr-text-dim">TRAIN LIKE YOU ALREADY HAVE THE JOB.</div>

      <div className="mt-8 max-w-xl text-sm text-cr-text-dim">
        Don't watch someone do automation. Come to work and do automation. Diagnose real PLC, VFD, and industrial network
        faults in a live 3D control room — the same way you would on your first day as an Automation Technician.
      </div>

      <button
        onClick={() => {
          setStudentName("Demo Student");
          navigate("/labs");
        }}
        className="btn btn-accent mt-10 px-8 py-2.5 text-sm"
      >
        Continue as Demo Student
      </button>
      <div className="mt-3 text-xs text-cr-text-dim">Demo Mode — no account, no AWS credentials, no AI required.</div>
    </div>
  );
}
