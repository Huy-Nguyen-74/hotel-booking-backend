import { SafeUser } from "../types/user";

export function toUserDto(user: SafeUser) {
    return {
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    };
}



