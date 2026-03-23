import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, User } from "lucide-react";

const COMMON_ILLNESSES = [
  "Hypertension",
  "Diabetes",
  "Arthritis",
  "Heart Disease",
  "Asthma",
  "COPD",
  "Stroke",
  "Osteoporosis",
  "Kidney Disease",
  "Cancer",
  "Dementia",
  "Depression / Anxiety",
  "Tuberculosis",
  "Cataract / Glaucoma",
  "Anemia",
  "Gout",
];

interface SeniorFormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  address: string;
  contactNumber: string;
  emergencyContact: string;
  illnesses: string;
  livingStatus: string;
  maritalStatus: string;
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
  illnesses: "",
  livingStatus: "With Family",
  maritalStatus: "Single",
  incomeLevel: "0-10k",
};

const SeniorForm = ({ onSubmit, initialData, initialPhotoUrl, submitLabel = "Register Senior" }: SeniorFormProps) => {
  const [form, setForm] = useState<SeniorFormData>(initialData || defaultForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl || null);
  const [selectedIllnesses, setSelectedIllnesses] = useState<string[]>(
    initialData?.illnesses ? initialData.illnesses.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  const [otherIllness, setOtherIllness] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      const parsed = initialData.illnesses
        ? initialData.illnesses.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      const known = parsed.filter(i => COMMON_ILLNESSES.includes(i));
      const other = parsed.filter(i => !COMMON_ILLNESSES.includes(i));
      setSelectedIllnesses(known);
      setOtherIllness(other.join(", "));
    }
  }, [initialData]);

  useEffect(() => {
    if (initialPhotoUrl) setPhotoPreview(initialPhotoUrl);
  }, [initialPhotoUrl]);

  const toggleIllness = (illness: string) => {
    setSelectedIllnesses(prev =>
      prev.includes(illness) ? prev.filter(i => i !== illness) : [...prev, illness]
    );
  };

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
    const allIllnesses = [
      ...selectedIllnesses,
      ...otherIllness.split(",").map(s => s.trim()).filter(Boolean),
    ];
    onSubmit({ ...form, illnesses: allIllnesses.join(", ") }, photoFile);
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

  const sectionLabel = (text: string) => (
    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 pb-1 border-b border-primary/20">{text}</p>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Responsive layout: single column (portrait) on mobile, two columns (landscape) on md+ screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LEFT COLUMN — Personal Info, Contact, Socioeconomic */}
        <div className="flex flex-col gap-5">

          {/* Personal Information */}
          <div>
            {sectionLabel("Personal Information")}
            {/* Photo upload: inline on mobile too, just smaller on compact screens */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="relative w-16 h-16 md:w-14 md:h-14 rounded-full border-2 border-muted bg-muted overflow-hidden flex items-center justify-center cursor-pointer group shrink-0"
                onClick={() => fileRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="photo" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 md:w-6 md:h-6 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Upload Photo</p>
                <p className="text-xs text-muted-foreground">Tap avatar to browse</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            {/* Name fields: stacked on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <Label className="text-xs">First Name *</Label>
                <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name *</Label>
                <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>

            {/* DOB + Gender: stacked on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date of Birth *</Label>
                <Input type="date" required value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                {agePreview !== null && <p className="text-xs text-muted-foreground">Age: {agePreview} yrs old</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gender *</Label>
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

          {/* Contact & Location */}
          <div>
            {sectionLabel("Contact & Location")}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Address *</Label>
                <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Purok, Barangay, Municipality" />
              </div>
              {/* Contact fields: stacked on mobile, side-by-side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Contact Number</Label>
                  <Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} placeholder="09xxxxxxxxx" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Emergency Contact</Label>
                  <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Name & number" />
                </div>
              </div>
            </div>
          </div>

          {/* Socioeconomic Status */}
          <div>
            {sectionLabel("Socioeconomic Status")}
            {/* Income + Living + Marital status: stacked on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Monthly Income</Label>
                <Select value={form.incomeLevel} onValueChange={(v) => setForm({ ...form, incomeLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-10k">₱0 – ₱10,000</SelectItem>
                    <SelectItem value="11-30k">₱11,000 – ₱30,000</SelectItem>
                    <SelectItem value="31-50k">₱31,000 – ₱50,000</SelectItem>
                    <SelectItem value="51-70k">₱51,000 – ₱70,000</SelectItem>
                    <SelectItem value="71-90k">₱71,000 – ₱90,000</SelectItem>
                    <SelectItem value="91k+">₱91,000 and above</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Living Status</Label>
                <Select value={form.livingStatus} onValueChange={(v) => setForm({ ...form, livingStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Living Alone">Living Alone</SelectItem>
                    <SelectItem value="With Family">With Family</SelectItem>
                    <SelectItem value="With Caregiver">With Caregiver</SelectItem>
                    <SelectItem value="In a Care Facility">In a Care Facility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Marital Status</Label>
                <Select value={form.maritalStatus} onValueChange={(v) => setForm({ ...form, maritalStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                    <SelectItem value="Separated">Separated</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit button shown here on mobile (below left column) */}
          <div className="block md:hidden">
            <Button type="submit" className="w-full">{submitLabel}</Button>
          </div>

        </div>

        {/* RIGHT COLUMN — Medical Conditions */}
        <div className="flex flex-col gap-3">
          {sectionLabel("Medical Conditions")}
          <p className="text-xs text-muted-foreground -mt-2">Select all that apply. Health status will be assessed by AI agent.</p>

          {/* Illness checkboxes: 1 col on mobile, 2 cols on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-border rounded-lg p-3 bg-muted/20 flex-1">
            {COMMON_ILLNESSES.map((illness) => (
              <div key={illness} className="flex items-center gap-2 py-0.5">
                <Checkbox
                  id={illness}
                  checked={selectedIllnesses.includes(illness)}
                  onCheckedChange={() => toggleIllness(illness)}
                />
                <label htmlFor={illness} className="text-xs text-foreground cursor-pointer leading-tight">
                  {illness}
                </label>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Other conditions (comma-separated)</Label>
            <Input
              placeholder="e.g. Lupus, Parkinson's"
              value={otherIllness}
              onChange={(e) => setOtherIllness(e.target.value)}
            />
          </div>

          {/* Submit button shown here on desktop (bottom of right column) */}
          <Button type="submit" className="w-full mt-auto hidden md:flex">{submitLabel}</Button>
        </div>

      </div>
    </form>
  );
};

export default SeniorForm;
