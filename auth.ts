// auth.ts
import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
    signOut: "/auth/sign-in",
  },
  ...authConfig,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      return !!existingUser;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      // Fetch user with all related MRS data
      const userWithDetails = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          mrsUserDepartment: {
            include: {
              businessUnit: true,
            },
          },
        },
      });

      if (!userWithDetails) return token;

      // Set token data
      token.id = userWithDetails.id;
      token.email = userWithDetails.email;
      token.firstName = userWithDetails.firstName;
      token.lastName = userWithDetails.lastName;
      token.name = `${userWithDetails.firstName} ${userWithDetails.lastName}`;
      token.contactNo = userWithDetails.contactNo;
      token.role = userWithDetails.role;
      token.image = userWithDetails.image;
      token.emailVerified = userWithDetails.emailVerified;

      // MRS Department data (if user has department assigned)
      token.mrsUserDepartment = userWithDetails.mrsUserDepartment
        ? {
            id: userWithDetails.mrsUserDepartment.id,
            name: userWithDetails.mrsUserDepartment.name,
            code: userWithDetails.mrsUserDepartment.code,
            description: userWithDetails.mrsUserDepartment.description,
            businessUnitId: userWithDetails.mrsUserDepartment.businessUnitId,
          }
        : null;

      // Get all active business units for the switcher
      const allBusinessUnits = await prisma.businessUnit.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });

      token.availableBusinessUnits = allBusinessUnits.map((bu) => ({
        id: bu.id,
        name: bu.name,
        code: bu.code,
        description: bu.description,
        isActive: bu.isActive,
      }));

      // Set active business unit
      // Default to user's department's business unit, or first available
      if (userWithDetails.mrsUserDepartment?.businessUnit) {
        token.activeBusinessUnit = {
          id: userWithDetails.mrsUserDepartment.businessUnit.id,
          name: userWithDetails.mrsUserDepartment.businessUnit.name,
          code: userWithDetails.mrsUserDepartment.businessUnit.code,
          description: userWithDetails.mrsUserDepartment.businessUnit.description,
          isActive: userWithDetails.mrsUserDepartment.businessUnit.isActive,
        };
      } else if (allBusinessUnits.length > 0) {
        // If user has no department, default to first business unit
        token.activeBusinessUnit = {
          id: allBusinessUnits[0].id,
          name: allBusinessUnits[0].name,
          code: allBusinessUnits[0].code,
          description: allBusinessUnits[0].description,
          isActive: allBusinessUnits[0].isActive,
        };
      } else {
        token.activeBusinessUnit = null;
      }

      return token;
    },

    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.name = token.name as string;
        session.user.contactNo = token.contactNo as string | null;
        session.user.role = token.role as UserRole;
        session.user.image = token.image as string | null;
        session.user.emailVerified = token.emailVerified as Date | null;
        
        // MRS data
        session.user.mrsUserDepartment = token.mrsUserDepartment as UserDepartment | null;
        session.user.activeBusinessUnit = token.activeBusinessUnit as UserBusinessUnit | null;
        session.user.availableBusinessUnits = token.availableBusinessUnits as UserBusinessUnit[];
      }
      return session;
    },
  },
});

// Import types for type safety
import type { UserRole } from "@prisma/client";
import type { UserDepartment, UserBusinessUnit } from "./next-auth";