import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/styles/base.css'
import './assets/styles/index.css'
import './assets/styles/variables.css'
import './assets/styles/global.css'
import './assets/styles/modern.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';
import { GlobalProvider } from './context/GlobalProvider.jsx';
import { Provider } from 'react-redux';
import store from './redux/store.js';
import TooltipWrapper from './hooks/tooltipWrapper.jsx'
import { HelmetProvider } from 'react-helmet-async'

// Mobile WebView auth handoff (see MobileChart.jsx for the full write-up).
// "isLoggedIn" is a non-secret hint, not a credential — safe to set here
// unconditionally for a webview-embedded load; if there's no valid session
// cookie, the subsequent auth check just fails harmlessly, same as any
// logged-out visit.
if (new URLSearchParams(window.location.search).get('webview') === '1') {
  try {
    if (!localStorage.getItem('isLoggedIn')) {
      localStorage.setItem('isLoggedIn', '1');
    }
  } catch (e) {
    // Some embedded WebViews restrict storage access — safe to ignore;
    // MobileChart.jsx's broker-disabled fallback covers this case too.
  }
}

// console.log("working: ", import.meta.env);

// Disable existing console logs in staging
// if (import.meta.env.VITE_APP_ENV === "staging") {
//   const originalConsole = {
//     log: console.log,
//     info: console.info,
//     warn: console.warn,
//     error: console.error,
//     debug: console.debug,
//   };

//   console.log = () => {};
//   console.info = () => {};
//   console.warn = () => {};
//   console.error = () => {};
//   console.debug = () => {};

//   window.devLog = (...args) => {
//     originalConsole.log(...args);
//   };
// }

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <HelmetProvider>
      <Provider store={store}>
        <GlobalProvider>
          <TooltipWrapper>
            <App />
          </TooltipWrapper>
        </GlobalProvider>
      </Provider>
    </HelmetProvider>
  </BrowserRouter>
)