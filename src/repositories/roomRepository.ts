import pool from "../database/db";

interface RoomSearchFilters {
  hotelId?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  checkInDate?: string;
  checkOutDate?: string;
}

/*
This is to create/update/get rooms
*/



/*
For getRooms: using optional filters (hotelId, roomId, type, price):
    - Default: return all rooms.
    - Invalid search value: return 400 Bad Request.
    - Valid search with no matches: return an empty array.
*/

export async function findRooms(filters: { hotelId?: number; roomId?: number; type?: string; price?: number }) {
    const values: Array<string | number> = [];
    const conditions: string[] = [];

    if (filters.hotelId !== undefined) {
        conditions.push(`hotel_id = $${values.length + 1}`);
        values.push(filters.hotelId);
    }

    if (filters.roomId !== undefined) {
        conditions.push(`id = $${values.length + 1}`);
        values.push(filters.roomId);
    }

    if (filters.type !== undefined) {
        conditions.push(`type = $${values.length + 1}`);
        values.push(filters.type);
    }

    if (filters.price !== undefined) {
        conditions.push(`price = $${values.length + 1}`);
        values.push(filters.price);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM rooms ${whereClause}`;
    const result = await pool.query(query, values);
    return result.rows;
}

export async function findAvailableRooms(filters: RoomSearchFilters) {
    const values: Array<string | number> = [];
    const conditions: string[] = [];

    if (filters.hotelId !== undefined) {
        conditions.push(`hotel_id = $${values.length + 1}`);
        values.push(filters.hotelId);
    }

    if (filters.type !== undefined) {
        conditions.push(`type = $${values.length + 1}`);
        values.push(filters.type);
    }

    if (filters.minPrice !== undefined) {
        conditions.push(`price >= $${values.length + 1}`);
        values.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
        conditions.push(`price <= $${values.length + 1}`);
        values.push(filters.maxPrice);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM rooms ${whereClause}`;
    const basicRoomSearch = await pool.query(query, values);

    // If checkInDate and checkOutDate are provided, filter out rooms that are already booked
    if (filters.checkInDate && filters.checkOutDate) {
        const bookedRoomsQuery = `
        SELECT DISTINCT room_id
        FROM bookings
        WHERE NOT (
            $1 >= check_out_date
            OR $2 <= check_in_date
        )
        AND status <> 'cancelled'`;

        const bookedRoomsResult = await pool.query(bookedRoomsQuery, [filters.checkInDate, filters.checkOutDate]);
        const bookedRoomIds = new Set(bookedRoomsResult.rows.map((booking) => booking.room_id));
        return basicRoomSearch.rows.filter((room) => !bookedRoomIds.has(room.id));
    }

    return basicRoomSearch.rows;
}

/*
For createRoom:
    - hotelId required
    - type required
    - price required
    - type must be a non-empty string after trim
    - price must be a positive number
*/


export async function createRoom(hotelId: number, type: string, price: number) {
    const result = await pool.query(
        `
        INSERT INTO rooms (hotel_id, type, price)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [hotelId, type, price]
    );
    return result.rows[0];
}


/*
For updateRoom:
    - roomId must be a valid number
    - at least one of type/price required
    - provided fields must be valid (type: non-empty string after trim, price: positive number)
    - if update returns null -> 404
*/


export async function updateRoom(roomId: number, type?: string, price?: number) {
    const result = await pool.query(
        `
        UPDATE rooms
        SET type = COALESCE($2, type), price = COALESCE($3, price)
        WHERE id = $1
        RETURNING *`,
        [roomId, type, price]
    );
    return result.rows[0];
}

