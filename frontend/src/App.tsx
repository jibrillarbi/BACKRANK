import { Routes, Route } from "react-router-dom"
import CalcPage from "./pages/CalcPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<CalcPage />} />
    </Routes>
  )
}

export default App