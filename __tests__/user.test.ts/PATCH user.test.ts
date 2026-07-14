/*
In this file, we are testing the PATCH /users/:id route of the userController.
The route is protected and requires authentication and authorization.

Routes:
- router.patch("/users/me", authenticateToken, authorizeRoles("admin", "staff"), updateSelfInfo);
- router.patch("/users/:id/deactivate", authenticateToken, authorizeRoles("admin"), deactivateUserById);
- router.patch("/users/:id", authenticateToken, authorizeRoles("admin"), updateUserInfo);

Checklist for PATCH /users/:id route:

Route contract:
- Who may access it? Only users with the "admin" role can deactivate or update other users. Both "admin" and "staff" roles can update their own information.
- Which method/path? PATCH /users/:id

Success:
- What valid outcomes must work? The route should update the user's information and return the updated user's information, excluding sensitive fields like password hashes.



*/


import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app";
import pool from "../../src/database/db";
import { authHeaders } from "../../src/helpers/authHelper";
import { adminLoginForTest, staffLoginForTest } from "../../src/helpers/loginHelper";

const createdUserIds: number[] = []; // Store created user IDs for cleanup



