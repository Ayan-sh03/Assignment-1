import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from './Components/ui/toaster'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RuleCombiner from './Components/ui/Rules'
import Eval from './Components/Eval'
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/rules',
    element: <RuleCombiner />,
  },
  {
    path: '/eval',
    element: <Eval />,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <RouterProvider router={router} />
  </StrictMode>
)
