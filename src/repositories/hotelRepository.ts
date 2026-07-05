import pool from "../database/db";

/*
For getHotels:
    Default: return all hotels.
    Invalid search value (in case of id): return 400 Bad Request.
    Valid search with no matches: return an empty array.
*/

export async function findHotels(filters: { city?: string; id?: number }) {
  const values: Array<string | number> = []; // Stores query parameter values in order for $1, $2, etc.
  const conditions: string[] = []; // Stores SQL condition strings that will later form the WHERE clause.

  if (filters.city !== undefined) { 
    values.push(filters.city);
    conditions.push(`LOWER(city) = LOWER($${values.length})`);
  }

  if (filters.id !== undefined) {
    values.push(filters.id);
    conditions.push(`id = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""; // Rule 1: when no filters are provided, WHERE is empty so query returns all hotels.

  const result = await pool.query(
    `
    SELECT *
    FROM hotels
    ${whereClause}
    ORDER BY id ASC
    `,
    values
  );

  return result.rows; // Rule 3: if filters are valid but no rows match, PostgreSQL returns an empty array.
}

export async function createHotel(name: string, city: string) {
    const result = await pool.query(
        `
        INSERT INTO hotels (name, city)
        VALUES ($1, $2)
        RETURNING *
        `,
        [name, city]
    );
    return result.rows[0];
}

export async function updateHotel(id: number, name?: string, city?: string) {
    const result = await pool.query(
        `
        UPDATE hotels
        SET name = COALESCE($2, name), city = COALESCE($3, city)
        WHERE id = $1
        RETURNING *
        `,
        [id, name, city]
    );
    return result.rows[0];
}

