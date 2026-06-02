
// app/lib/api.ts
export interface Car {
  id: number;
  brand: string;
  model: string;
  manufactureYear: number;
  pricePerDay: number;
  available: boolean;
}

const BASE_URL = "http://localhost:8083/api/cars";

export async function getCars(): Promise<Car[]> {
  const res = await fetch(BASE_URL);
  return res.json();
}

export async function addCar(car: Omit<Car, "id">): Promise<Car> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(car),
  });
  return res.json();
}

export async function updateCar(id: number, car: Partial<Car>): Promise<Car> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(car),
  });
  return res.json();
}

export async function deleteCar(id: number): Promise<void> {
  await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
}

export async function getAvailableCars(): Promise<Car[]> {
  const res = await fetch(`${BASE_URL}/available`);
  return res.json();
}

