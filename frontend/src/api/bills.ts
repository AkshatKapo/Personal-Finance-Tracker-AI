import api from "./axiosClient";

export const getMonthlyBillsSummary = async () => {
  const res = await api.get("/bills/summary");
  return res.data;
};
