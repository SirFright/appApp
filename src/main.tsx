import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { DataProvider } from './data/dataSource'
import { UserStateProvider } from './store/userState'
import { FiltersProvider } from './state/filters'
import './index.css'

// HashRouter keeps deep links working when the app is hosted on static hosts
// or packaged into a native shell (Capacitor) without server rewrite rules.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <UserStateProvider>
        <DataProvider>
          <FiltersProvider>
            <App />
          </FiltersProvider>
        </DataProvider>
      </UserStateProvider>
    </HashRouter>
  </React.StrictMode>,
)
