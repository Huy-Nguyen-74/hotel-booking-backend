import request from "supertest";
import { expect } from "@jest/globals";
import { app } from "../app";

export async function adminLoginForTest(): Promise<string> {
  const response = await request(app)
    .post("/login")
    .send({
      email: "admin@hotel.local",
      password: "Admin123456789!",
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));

  return response.body.token;
}

export async function staffLoginForTest(): Promise<string> {
  const response = await request(app)
    .post("/login")
    .send({
      email: "staff@hotel.local",
      password: "Staff123456789!",
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));

  return response.body.token;
}


export async function tempAdminLoginForTest(email: string, password: string): Promise<string> {
  const response = await request(app)
    .post("/login")
    .send({
      email: email,
      password: password,
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));

  return response.body.token;
}

export async function tempStaffLoginForTest(email: string, password: string): Promise<string> {
  const response = await request(app)
    .post("/login")
    .send({
      email: email,
      password: password,
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));

  return response.body.token;
}

