"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { SERVICES, VEHICLE_BRANDS } from "@/lib/constants";
import { generateTrackingCode } from "@/lib/appointment-tracking";

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
}: AddAppointmentModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "N/A",
    phone: "N/A",
    vehicleBrand: "",
    customVehicleBrand: "",
    vehicleModel: "",
    vehicleYear: new Date().getFullYear().toString(),
    vehiclePlate: "",
    vehicleColor: "",
    chassisNumber: "",
    engineNumber: "",
    insurance: "",
    serviceAdvisor: "",
    assigneeDriver: "",
    service: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.service) {
      toast({
        title: "Missing fields",
        description: "Please fill in the required fields (Name and Service).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const trackingCode = generateTrackingCode();
      const finalBrand =
        formData.vehicleBrand === "Other"
          ? formData.customVehicleBrand
          : formData.vehicleBrand;

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingCode,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          vehicleMake: finalBrand,
          vehicleModel: formData.vehicleModel,
          vehicleYear: formData.vehicleYear,
          vehiclePlate: formData.vehiclePlate,
          vehicleColor: formData.vehicleColor,
          chassisNumber: formData.chassisNumber,
          engineNumber: formData.engineNumber,
          insurance: formData.insurance,
          serviceAdvisor: formData.serviceAdvisor,
          assigneeDriver: formData.assigneeDriver,
          service: formData.service,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }

      toast({
        title: "Success",
        description: "Appointment created successfully.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "N/A",
        phone: "N/A",
        vehicleBrand: "",
        customVehicleBrand: "",
        vehicleModel: "",
        vehicleYear: new Date().getFullYear().toString(),
        vehiclePlate: "",
        vehicleColor: "",
        chassisNumber: "",
        engineNumber: "",
        insurance: "",
        serviceAdvisor: "",
        assigneeDriver: "",
        service: "",
        message: "",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Appointment</DialogTitle>
          <DialogDescription>
            Manually create a new appointment for walk-in or offline customers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Row 1: Customer Info */}
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="MARIA"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="N/A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="text"
                value={formData.email}
                onChange={handleChange}
                placeholder="N/A"
              />
            </div>

            {/* Row 2: Vehicle Core */}
            <div className="space-y-2">
              <Label htmlFor="vehicleBrand">Vehicle Make</Label>
              {formData.vehicleBrand !== "Other" ? (
                <Select
                  value={formData.vehicleBrand}
                  onValueChange={(val) => handleSelectChange("vehicleBrand", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toyota" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {VEHICLE_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="customVehicleBrand"
                    name="customVehicleBrand"
                    value={formData.customVehicleBrand}
                    onChange={handleChange}
                    placeholder="Enter custom make"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectChange("vehicleBrand", "")}
                    className="h-9 px-2 text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Vehicle Model</Label>
              <Input
                id="vehicleModel"
                name="vehicleModel"
                value={formData.vehicleModel}
                onChange={handleChange}
                placeholder="WIGO"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleYear">Vehicle Year</Label>
              <Input
                id="vehicleYear"
                name="vehicleYear"
                value={formData.vehicleYear}
                onChange={handleChange}
                placeholder="2024"
              />
            </div>

            {/* Row 3: Vehicle ID & Detail */}
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Plate Number</Label>
              <Input
                id="vehiclePlate"
                name="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={handleChange}
                placeholder="KAF 9050"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleColor">Vehicle Color</Label>
              <Input
                id="vehicleColor"
                name="vehicleColor"
                value={formData.vehicleColor}
                onChange={handleChange}
                placeholder="BLACK"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chassisNumber">Chassis Number</Label>
              <Input
                id="chassisNumber"
                name="chassisNumber"
                value={formData.chassisNumber}
                onChange={handleChange}
                placeholder="Enter Chassis #"
              />
            </div>

            {/* Row 4: Technical & Insurance */}
            <div className="space-y-2">
              <Label htmlFor="engineNumber">Engine Number</Label>
              <Input
                id="engineNumber"
                name="engineNumber"
                value={formData.engineNumber}
                onChange={handleChange}
                placeholder="Enter Engine #"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance">Insurance</Label>
              <Input
                id="insurance"
                name="insurance"
                value={formData.insurance}
                onChange={handleChange}
                placeholder="Enter Insurance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceAdvisor">Service Advisor (S/A)</Label>
              <Input
                id="serviceAdvisor"
                name="serviceAdvisor"
                value={formData.serviceAdvisor}
                onChange={handleChange}
                placeholder="RYAN"
              />
            </div>

            {/* Row 5: Admin & Service */}
            <div className="space-y-2">
              <Label htmlFor="assigneeDriver">Assignee/Driver</Label>
              <Input
                id="assigneeDriver"
                name="assigneeDriver"
                value={formData.assigneeDriver}
                onChange={handleChange}
                placeholder="Enter Driver"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="service">Service Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.service}
                onValueChange={(val) => handleSelectChange("service", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Body Repairs & Painting" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {SERVICES.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Concerns / Notes</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe the issues or additional requests..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
