import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode is intentionally omitted. Its dev-mode double-mount briefly
// creates two WebGL contexts for the R3F <Canvas>, which some browsers/sandboxes
// resolve by losing the first context — a well-known R3F/StrictMode interaction.
createRoot(document.getElementById('root')!).render(<App />)
