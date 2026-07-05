import {
  findHotels,
  createHotel as repositoryCreateHotel,
  updateHotel as repositoryUpdateHotel,
} from "../repositories/hotelRepository";

/*
For getHotels:
    Default: return all hotels.
    Invalid search value (in case of id): return 400 Bad Request.
    Valid search with no matches: return an empty array.
*/

export async function getHotels(filters: { city?: string; id?: number }) {
    return await findHotels(filters);
}

export async function createHotel(name: string, city: string) {
    return await repositoryCreateHotel(name, city);
}

export async function updateHotel(id: number, name?: string, city?: string) {
    return await repositoryUpdateHotel(id, name, city);
}
