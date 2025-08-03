import axios from "axios";

export async function getExchangeRates(baseCurrency: string) {
  const response = await axios.get(
    `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
  );
  return response.data.rates;
}
