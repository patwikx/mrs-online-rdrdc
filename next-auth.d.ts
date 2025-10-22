// next-auth.d.ts
import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client";

// Define the structure for a user's department (MRS)
export interface UserDepartment {
  id: string;
  name: string;
  code: string;
  description: string | null;
  businessUnitId: string;
}

// Define the structure for a user's business unit (MRS)
export interface UserBusinessUnit {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      name: string; // Computed from firstName + lastName
      contactNo: string | null;
      role: UserRole;
      image: string | null;
      emailVerified: Date | null;
     
      // MRS Department & Business Unit
      mrsUserDepartment: UserDepartment | null;
     
      // Active Business Unit (for switcher)
      activeBusinessUnit: UserBusinessUnit | null;
     
      // Available Business Units (for switcher dropdown)
      availableBusinessUnits: UserBusinessUnit[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    contactNo: string | null;
    role: UserRole;
    image: string | null;
    emailVerified: Date | null;
   
    // MRS Department & Business Unit
    mrsUserDepartment: UserDepartment | null;
   
    // Active Business Unit (for switcher)
    activeBusinessUnit: UserBusinessUnit | null;
   
    // Available Business Units (for switcher)
    availableBusinessUnits: UserBusinessUnit[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    contactNo: string | null;
    role: UserRole;
    image: string | null;
    emailVerified: Date | null;
   
    // MRS Department & Business Unit
    mrsUserDepartment: UserDepartment | null;
   
    // Active Business Unit (for switcher)
    activeBusinessUnit: UserBusinessUnit | null;
   
    // Available Business Units (for switcher)
    availableBusinessUnits: UserBusinessUnit[];
  }
}