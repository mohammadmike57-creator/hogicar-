export interface Car {
    id?: number;
    brand: string;
    model: string;
    manufactureYear: number;
    pricePerDay: number;
    available: boolean;
}

const API_BASE = "http://localhost:8083/api/cars";

export async function getCars(): Promise<Car[]> {
    const res = await fetch(API_BASE);
    return res.json();
}

export async function getAvailableCars(): Promise<Car[]> {
    const res = await fetch(`${API_BASE}/available`);
    return res.json();
}

export async function createCar(car: Car) {
    return fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
    });
}

export async function updateCar(id: number, car: Car) {
    return fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
    });
}

export async function deleteCar(id: number) {
    return fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
    });
}
