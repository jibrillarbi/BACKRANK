import { useQuery } from "@tanstack/react-query"
import { api } from "../api"
const CalcPage = () => {
    const { data, isLoading, isError } = useQuery({
    queryKey: ["root"],
    queryFn: api.getRoot
  })

  if (isLoading) return <p className="p-8">Loading...</p>
  if (isError) return <p className="p-8 text-red-500">Error connecting to backend.</p>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-500">{data.message}</h1>
      <h2>Hello</h2>
    </div>
  )
}
export default CalcPage