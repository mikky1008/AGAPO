import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, User } from "lucide-react";

interface SeniorFormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  address: string;
  contactNumber: string;
  emergencyContact: string;
  illnesses: string[];
  livingStatus: string;
  incomeLevel: string;
}

interface SeniorFormProps {
  onSubmit: (data: SeniorFormData, photoFile?: File | null) => void;
  initialData?: Omit<SeniorFormData, "illnesses"> & { illnesses?: string[] | string };
  initialPhotoUrl?: string | null;
  submitLabel?: string;
}

const COMMON_ILLNESSES = [
  "Hypertension",
  "Diabetes",
  "Arthritis",
  "Heart Disease",
  "Stroke",
  "Asthma",
  "COPD",
  "Kidney Disease",
  "Osteoporosis",
  "Dementia / Alzheimer's",
  "Cancer",
  "Parkinson's Disease",
  "Cataracts / Eye Condition",
  "Depression / Anxiety",
  "Tuberculosis",
];

const defaultForm: SeniorFormData = {
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "Male",
  address: "",
  contactNumber: "",
  emergencyContact: "",
  illnesses: [],
  livingStatus: "With Family",
  incomeLevel: "0-10k",
};

const SeniorForm = ({ onSubmit, initialData, initialPhotoUrl, submitLabel = "Register Senior" }: SeniorFormProps) => {
  const normalizeIllnesses = (val: string[] | string | undefined): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const [form, setForm] = useState<SeniorFormData>({
    ...defaultForm,
    ...initialData,
    illnesses: normalizeIllnesses(initialData?.illnesses),
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl || null);
  const [otherIllness, setOtherIllness] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setForm({ ...defaultForm, ...initialData, illnesses: normalizeIllnesses(initialData.illnesses) });
    }
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
    const finalIllnesses = [...form.illnesses];
    if (otherIllness.trim()) {
      otherIllness.split(",").map(s => s.trim()).filter(Boolean).forEach(i => {
        if (!finalIllnesses.includes(i)) finalIllnesses.push(i);
      });
    }
    onSubmit({ ...form, illnesses: finalIllnesses }, photoFile);
  };

  const toggleIllness = (illness: string) => {
    setForm(prev => ({
      ...prev,
      illnesses: prev.illnesses.includes(illness)
        ? prev.illnesses.filter(i => i !== illness)
        : [...prev.illnesses, illness],
    }));
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
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Row 1: Photo + Personal Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Photo */}
        <div className="flex flex-col items-center gap-2 justify-start pt-2">
          <div
            className="relative w-24 h-24 rounded-full border-2 border-muted bg-muted overflow-hidden flex items-center justify-center cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="photo" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Click to upload photo</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        {/* Name + DOB + Gender */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
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
      </div>

      {/* ── Row 2: Address + Contact ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5 md:col-span-1">
          <Label htmlFor="address">Address</Label>
          <Input id="address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input id="contactNumber" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emergencyContact">Emergency Contact</Label>
          <Input id="emergencyContact" placeholder="Name & number" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
        </div>
      </div>

      {/* ── Row 3: Income + Living Status ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Monthly Income Level</Label>
          <Select value={form.incomeLevel} onValueChange={(v) => setForm({ ...form, incomeLevel: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0-10k">₱0 – ₱10,000</SelectItem>
              <SelectItem value="11-30k">₱11,000 – ₱30,000</SelectItem>
              <SelectItem value="31-50k">₱31,000 – ₱50,000</SelectItem>
              <SelectItem value="51-70k">₱51,000 – ₱70,000</SelectItem>
              <SelectItem value="71-90k">₱71,000 – ₱90,000</SelectItem>
              <SelectItem value="90k+">₱90,000+</SelectItem>
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
              <SelectItem value="Married">Married</SelectItem>
              <SelectItem value="Widow">Widow</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Row 4: Illnesses Checkboxes ── */}
      <div className="space-y-2">
        <Label>Illnesses</Label>
        <p className="text-xs text-muted-foreground">Health status will be assessed by AI agent based on illnesses in a future update.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-border rounded-lg p-3 bg-muted/20">
          {COMMON_ILLNESSES.map((illness) => (
            <div key={illness} className="flex items-center gap-2">
              <Checkbox
                id={illness}
                checked={form.illnesses.includes(illness)}
                onCheckedChange={() => toggleIllness(illness)}
              />
              <label htmlFor={illness} className="text-sm text-foreground cursor-pointer">{illness}</label>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 mt-2">
          <Label htmlFor="otherIllness">Other (comma-separated)</Label>
          <Input
            id="otherIllness"
            placeholder="e.g. Gout, Anemia"
            value={otherIllness}
            onChange={(e) => setOtherIllness(e.target.value)}
          />
        </div>
        {form.illnesses.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Selected: {form.illnesses.join(", ")}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );
};

export default SeniorForm;
