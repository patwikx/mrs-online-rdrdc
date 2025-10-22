// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { LoginSchema } from "@/lib/validations/login-schema";
import { getUserByEmail } from "@/lib/auth-actions/auth-users";
import type { UserDepartment, UserBusinessUnit } from "./next-auth";

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          const user = await getUserByEmail(email);

          if (!user || !user.password) return null;

          const passwordsMatch = await bcryptjs.compare(
            password,
            user.password
          );

          if (passwordsMatch) {
            // Get all active business units
            const prisma = (await import("@/lib/prisma")).prisma;
            const allBusinessUnits = await prisma.businessUnit.findMany({
              where: { isActive: true },
              orderBy: { name: "asc" },
            });

            // Prepare MRS Department data
            const mrsUserDepartment: UserDepartment | null = user.mrsUserDepartment
              ? {
                  id: user.mrsUserDepartment.id,
                  name: user.mrsUserDepartment.name,
                  code: user.mrsUserDepartment.code,
                  description: user.mrsUserDepartment.description,
                  businessUnitId: user.mrsUserDepartment.businessUnitId,
                }
              : null;

            // Determine active business unit
            let activeBusinessUnit: UserBusinessUnit | null = null;

            if (user.mrsUserDepartment?.businessUnit) {
              activeBusinessUnit = {
                id: user.mrsUserDepartment.businessUnit.id,
                name: user.mrsUserDepartment.businessUnit.name,
                code: user.mrsUserDepartment.businessUnit.code,
                description: user.mrsUserDepartment.businessUnit.description,
                isActive: user.mrsUserDepartment.businessUnit.isActive,
              };
            } else if (allBusinessUnits.length > 0) {
              activeBusinessUnit = {
                id: allBusinessUnits[0].id,
                name: allBusinessUnits[0].name,
                code: allBusinessUnits[0].code,
                description: allBusinessUnits[0].description,
                isActive: allBusinessUnits[0].isActive,
              };
            }

            // Transform User to NextAuth User format
            return {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              contactNo: user.contactNo,
              role: user.role,
              image: user.image,
              emailVerified: user.emailVerified,
              
              // MRS Department
              mrsUserDepartment,
              
              // Active business unit
              activeBusinessUnit,
              
              // All available business units for switcher
              availableBusinessUnits: allBusinessUnits.map((bu) => ({
                id: bu.id,
                name: bu.name,
                code: bu.code,
                description: bu.description,
                isActive: bu.isActive,
              })),
            };
          }
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;