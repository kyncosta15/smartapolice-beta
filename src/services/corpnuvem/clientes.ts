import { corpClient } from "@/lib/corpClient";

export async function getClientesCorpNuvem() {
  const res = await corpClient.get("/clientes");
  return res.data;
}
