import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, User } from "lucide-react";

interface SeniorFormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  address: string;
  contactNumber: string;
  emergencyContact: string;
  healthStatus: string;
  illnesses: string;
  livingStatus: string;
  incomeLevel: string;
}

interface SeniorFormProps {
  onSubmit: (data: SeniorFormData, photoFile?: File | null) => void;
  initialData?: SeniorFormData;
  initialPhotoUrl?: string | null;
  submitLabel?: string;
}

const defaultForm: SeniorFormData = {
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "Male",
  address: "",
  contactNumber: "",
  emergencyContact: "",
  healthStatus: "Good",
  illnesses: "",
  livingStatus: "With Family",
  incomeLevel: "Low",
};

const SeniorForm = ({ onSubmit, initialData, initialPhotoUrl, submitLabel = "Register Senior" }: SeniorFormProps) => {
  const [form, setForm] = useState<SeniorFormData>(initialData || defaultForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl || null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  useEffect(() => {
    if (initialPhotoUrl) setPhotoPreview(initialPhotoUrl);
  }, [initialPhotoUrl]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, photoFile);
  };

  const agePreview = form.birthDate
    ? (() => {
        const today = new Date();
        const birth = new Date(form.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
      })()
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo upload */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative w-20 h-20 rounded-full border-2 border-muted bg-muted overflow-hidden flex items-center justify-center cursor-pointer group"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="photo" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-muted-foreground" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Click to upload photo</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">Date of Birth</Label>
          <Input id="birthDate" type="date" required value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          {agePreview !== null && (
            <p className="text-xs text-muted-foreground">Age: {agePreview} years old</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input id="address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input id="contactNumber" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emergencyContact">Emergency Contact</Label>
          <Input id="emergencyContact" placeholder="Name & number" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Health Status</Label>
        <Select value={form.healthStatus} onValueChange={(v) => setForm({ ...form, healthStatus: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Good">Good</SelectItem>
            <SelectItem value="Fair">Fair</SelectItem>
            <SelectItem value="Poor">Poor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="illnesses">Illnesses (comma-separated)</Label>
        <Input id="illnesses" placeholder="e.g. Hypertension, Diabetes" value={form.illnesses} onChange={(e) => setForm({ ...form, illnesses: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Income Level</Label>
        <Select value={form.incomeLevel} onValueChange={(v) => setForm({ ...form, incomeLevel: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low Income</SelectItem>
            <SelectItem value="Below Average">Below Average</SelectItem>
            <SelectItem value="Average">Average</SelectItem>
            <SelectItem value="Above Average">Above Average</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Living Status</Label>
        <Select value={form.livingStatus} onValueChange={(v) => setForm({ ...form, livingStatus: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Living Alone">Living Alone</SelectItem>
            <SelectItem value="With Family">With Family</SelectItem>
            <SelectItem value="With Caregiver">With Caregiver</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );
};

export default SeniorForm;
