import { z } from "zod";
import { USER_ROLES, UserRole } from "@/core/constants";
import { passwordStrengthSchema } from "@/core/auth/password";

export const RegisterDto = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordStrengthSchema,
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  role: z
    .enum([
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ORG_ADMIN,
      USER_ROLES.MANAGER,
      USER_ROLES.DISPATCHER,
      USER_ROLES.DRIVER,
      USER_ROLES.VIEWER,
    ] as [UserRole, ...UserRole[]])
    .optional()
    .default(USER_ROLES.VIEWER),
  organizationId: z.string().uuid().optional().nullable(),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().min(1, "User ID or Email address is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginDtoType = z.infer<typeof LoginDto>;

export const ForgotPasswordDto = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordDtoType = z.infer<typeof ForgotPasswordDto>;

export const ResetPasswordDto = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordStrengthSchema,
});

export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordStrengthSchema,
});

export type ChangePasswordDtoType = z.infer<typeof ChangePasswordDto>;
