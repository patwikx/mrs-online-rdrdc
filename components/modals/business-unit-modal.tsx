"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessUnitModal } from "../../hooks/use-bu-modal";
import { toast } from "sonner";
import type { CreateBusinessUnitRequest } from "@/types/business-unit";

const formSchema = z.object({
  code: z.string().min(1, { message: "Business unit code is required." }),
  name: z.string().min(1, { message: "Business unit name is required." }),
  description: z.string().optional(),
});

type FormData = CreateBusinessUnitRequest;

export const BusinessUnitModal = () => {
  const businessUnitModal = useBusinessUnitModal();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/business-units", values);
      toast.success("Business unit created successfully!");
      businessUnitModal.onClose();
      form.reset();
      // Optionally refresh the page or update the data
      window.location.reload();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Something went wrong";
        toast.error(message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={businessUnitModal.isOpen} onOpenChange={(open: boolean) => !open && businessUnitModal.onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Business Unit</DialogTitle>
          <DialogDescription>
            Add a new business unit to manage properties and operations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              placeholder="BU001"
              disabled={loading}
              {...form.register("code")}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Tropicana Resort"
              disabled={loading}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the business unit..."
              disabled={loading}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={businessUnitModal.onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Business Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
