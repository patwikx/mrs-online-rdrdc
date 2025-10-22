"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { useUserManagementModal } from "@/hooks/use-userManagementModal";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username/Email is required." }).email({ message: "Please enter a valid email address." }),
  role: z.nativeEnum(UserRole, { 
    message: "Please select a role."
  }),
});

type UserManagementFormValues = z.infer<typeof formSchema>;

// Helper to format role names for display
const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    ADMIN: "Administrator",
    MANAGER: "Manager",
    STAFF: "Staff",
    TENANT: "Tenant",
    TREASURY: "Treasury",
    PURCHASER: "Purchaser",
    ACCTG: "Accounting",
    VIEWER: "Viewer",
    OWNER: "Owner",
    STOCKROOM: "Stockroom",
    MAINTENANCE: "Maintenance",
  };
  return roleNames[role] || role;
};

// Helper to get role description
const getRoleDescription = (role: UserRole): string => {
  const descriptions: Record<UserRole, string> = {
    ADMIN: "Full system access and user management",
    MANAGER: "Department management and approvals",
    STAFF: "Basic access to create requests",
    TENANT: "Limited tenant access",
    TREASURY: "Financial and payment management",
    PURCHASER: "Purchasing and procurement",
    ACCTG: "Accounting and financial records",
    VIEWER: "Read-only access",
    OWNER: "Full ownership and control",
    STOCKROOM: "Inventory and stock management",
    MAINTENANCE: "Maintenance and repairs",
  };
  return descriptions[role] || "";
};

export const UserManagementModal = () => {
  const { isOpen, onClose, initialData, availableRoles } = useUserManagementModal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isEditMode = !!initialData;
  const title = isEditMode ? "Update User Role" : "Assign User";
  const description = isEditMode
    ? "Change the role for this user."
    : "Assign an existing user by their email address.";
  const action = isEditMode ? "Save changes" : "Assign";

  const form = useForm<UserManagementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      role: undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        username: initialData.username || "",
        role: initialData.role,
      });
    } else {
      form.reset({ 
        username: "", 
        role: undefined 
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: UserManagementFormValues) => {
    try {
      setLoading(true);
      
      if (isEditMode && initialData) {
        // Update existing user's role
        await axios.patch(`/api/user-management/${initialData.userId}`, {
          role: data.role,
        });
        toast.success("User role updated successfully.");
      } else {
        // Assign new user
        await axios.post("/api/user-management", {
          username: data.username,
          role: data.role,
        });
        toast.success("User assigned successfully.");
      }
      
      router.refresh();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Something went wrong.";
        toast.error(message);
      } else {
        toast.error("Something went wrong.");
      }
      console.error("User management error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Username / Email */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      disabled={loading || isEditMode}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditMode 
                      ? "Email address cannot be changed" 
                      : "Enter the user's email address"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Select */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {getRoleDisplayName(role)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getRoleDescription(role)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Select the appropriate role for this user
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : action}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};