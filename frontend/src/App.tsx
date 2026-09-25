import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { LabLibrary } from "./pages/LabLibrary";
import { Progress } from "./pages/Progress";
import { Skills } from "./pages/Skills";
import { InstructorSetup } from "./pages/InstructorSetup";
import { Portfolio } from "./pages/Portfolio";

// Code-split the 3D lab (three.js/R3F/drei) out of the initial bundle — the
// library/progress/portfolio/landing pages should stay fast and lightweight.
const LabRunner = lazy(() => import("./pages/LabRunner").then((m) => ({ default: m.LabRunner })));

function LabLoading() {
  return <div className="flex h-screen items-center justify-center bg-cr-bg text-cr-text-dim">Loading lab environment…</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/labs" element={<LabLibrary />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/lab/lab1-motor-control/setup" element={<InstructorSetup />} />
        <Route
          path="/lab/lab1-motor-control"
          element={
            <Suspense fallback={<LabLoading />}>
              <LabRunner />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
