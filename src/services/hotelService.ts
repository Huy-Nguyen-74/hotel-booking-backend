import { AppError } from "../errors/AppError";
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

export async function getHotels(filters: { hotelId?: number; name?: string; city?: string }) {
    return await findHotels(filters);
}


/*
For createHotel:
    - name required
    - city required
    - overlap check: if a hotel with the same name and city already exists, return 400 Bad Request
    - both must be non-empty strings after trim

For updateHotel:
    - hotelId must be valid number
    - at least one of name/city required
    - provided fields must be non-empty strings after trim
    - if update returns null → 404
*/

export async function createHotel(name: string, city: string) {
    
    const overlapHotel = await findHotels({ name, city });
    if (overlapHotel.length > 0) {
        throw new AppError("Hotel already exists", 400);
    }

    return await repositoryCreateHotel(name, city);
}

export async function updateHotel(hotelId: number, name?: string, city?: string) {
    return await repositoryUpdateHotel(hotelId, name, city);
}
