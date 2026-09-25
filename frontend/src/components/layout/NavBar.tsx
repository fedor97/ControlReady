import { NavLink } from "react-router-dom";
import { useProgressStore } from "../../state/progressStore";

export function NavBar() {
  const studentName = useProgressStore((s) => s.studentName);

  const link = "btn px-3 py-1.5 text-xs";
  const active = "btn-active";
  const inactive = "";

  return (
    <header className="flex items-center justify-between border-b border-cr-border bg-cr-panel px-6 py-3">
      <div className="flex items-center gap-8">
        <div>
          <div className="font-mono-industrial text-base font-black tracking-tight text-cr-text">
            CONTROL<span className="text-cr-accent">READY</span>
          </div>
          <div className="text-[10px] tracking-widest text-cr-text-dim">TRAIN LIKE YOU ALREADY HAVE THE JOB.</div>
        </div>
        <nav className="flex gap-1">
          <NavLink to="/labs" className={({ isActive }) => `${link} ${isActive ? active : inactive}`}>
            Labs
          </NavLink>
          <NavLink to="/progress" className={({ isActive }) => `${link} ${isActive ? active : inactive}`}>
            Progress
          </NavLink>
          <NavLink to="/skills" className={({ isActive }) => `${link} ${isActive ? active : inactive}`}>
            Skills
          </NavLink>
          <NavLink to="/portfolio" className={({ isActive }) => `${link} ${isActive ? active : inactive}`}>
            Portfolio
          </NavLink>
        </nav>
      </div>
      <div className="text-right text-xs text-cr-text-dim">
        <div className="font-semibold text-cr-text">{studentName}</div>
        <div>Demo Mode</div>
      </div>
    </header>
  );
}
