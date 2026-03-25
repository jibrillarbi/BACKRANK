import client from "./client"

export const api = {
  getRoot: () => client.get("/").then(res => res.data),
}