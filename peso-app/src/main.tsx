import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

try {
  const isStaffOrAdminRoute = ["/staff", "/superadmin"].includes(
    window.location.pathname,
  );
  if (
    !isStaffOrAdminRoute &&
    window.localStorage.getItem("peso-end-user-theme") === "dark"
  ) {
    document.documentElement.dataset.theme = "dark";
  }
} catch (error) {
  console.error("Could not initialize the saved theme preference:", error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)