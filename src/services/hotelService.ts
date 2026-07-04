import {
  findAllHotels,
  findAllRooms,
  findHotelById,
  findHotelsByCity,
  findRoomsByHotelId,
} from "../repositories/hotelRepository";

export async function getAllHotels() {
  return findAllHotels();
}

export async function getAllRooms() {
  return findAllRooms();
}

export async function getHotelById(id: number) {
  return findHotelById(id);
}

export async function getHotelsByCity(city: string) {
  return findHotelsByCity(city);
}

export async function getRoomsByHotelId(hotelId: number) {
  return findRoomsByHotelId(hotelId);
}