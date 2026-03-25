import { useEffect, useState } from "react"

function App() {
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then(res => res.json())
      .then(data => setMessage(data.message))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-500">{message}</h1>
    </div>
  )
}

export default App