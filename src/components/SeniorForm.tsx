import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Camera, User, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subYears, getYear, setYear, setMonth, getMonth } from "date-fns";

const COMMON_ILLNESSES = [
  "Hypertension", "Diabetes", "Arthritis", "Heart Disease",
  "Asthma", "COPD", "Stroke", "Osteoporosis",
  "Kidney Disease", "Cancer", "Dementia", "Depression / Anxiety",
  "Tuberculosis", "Cataract / Glaucoma", "Anemia", "Gout",
];

interface SeniorFormData {
  firstName: string; lastName: string; birthDate: string; gender: string;
  address: string; contactNumber: string; emergencyContact: string;
  illnesses: string; livingStatus: string; maritalStatus: string; incomeLevel: string;
}

interface SeniorFormProps {
  onSubmit: (data: SeniorFormData, photoFile?: File | null) => void;
  initialData?: SeniorFormData;
  initialPhotoUrl?: string | null;
  submitLabel?: string;
}

const defaultForm: SeniorFormData = {
  firstName: "", lastName: "", birthDate: "", gender: "Male",
  address: "", contactNumber: "", emergencyContact: "",
  illnesses: "", livingStatus: "With Family", maritalStatus: "Single", incomeLevel: "0-10k",
};

// Max date allowed: must be at least 60 years old
const MAX_BIRTH_DATE = subYears(new Date(), 60);
// Min date: 120 years old is a reasonable cap
const MIN_BIRTH_DATE = subYears(new Date(), 120);

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SeniorForm = ({ onSubmit, initialData, initialPhotoUrl, submitLabel = "Register Senior" }: SeniorFormProps) => {
  const [form, setForm] = useState<SeniorFormData>(initialData || defaultForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl || null);
  const [selectedIllnesses, setSelectedIllnesses] = useState<string[]>(
    initialData?.illnesses ? initialData.illnesses.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  const [otherIllness, setOtherIllness] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    initialData?.birthDate ? new Date(initialData.birthDate) : MAX_BIRTH_DATE
  );
  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof SeniorFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SeniorFormData, boolean>>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      const parsed = initialData.illnesses
        ? initialData.illnesses.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      setSelectedIllnesses(parsed.filter(i => COMMON_ILLNESSES.includes(i)));
      setOtherIllness(parsed.filter(i => !COMMON_ILLNESSES.includes(i)).join(", "));
      if (initialData.birthDate) setCalendarMonth(new Date(initialData.birthDate));
    }
  }, [initialData]);

  useEffect(() => {
    if (initialPhotoUrl) setPhotoPreview(initialPhotoUrl);
  }, [initialPhotoUrl]);

  const validate = (data: SeniorFormData): Partial<Record<keyof SeniorFormData, string>> => {
    const e: Partial<Record<keyof SeniorFormData, string>> = {};
    if (!data.firstName.trim()) e.firstName = "First name is required.";
    if (!data.lastName.trim()) e.lastName = "Last name is required.";
    if (!data.birthDate) {
      e.birthDate = "Date of birth is required.";
    } else {
      const birth = new Date(data.birthDate);
      const age = calculateAge(birth);
      if (age < 60) e.birthDate = "Senior must be at least 60 years old.";
      if (age > 120) e.birthDate = "Please enter a valid birth date.";
    }
    if (!data.address.trim()) e.address = "Address is required.";
    return e;
  };

  const touchField = (field: keyof SeniorFormData) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const toggleIllness = (illness: string) =>
    setSelectedIllnesses(prev =>
      prev.includes(illness) ? prev.filter(i => i !== illness) : [...prev, illness]
    );

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
    // Touch all required fields
    setTouched({ firstName: true, lastName: true, birthDate: true, address: true });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const allIllnesses = [
      ...selectedIllnesses,
      ...otherIllness.split(",").map(s => s.trim()).filter(Boolean),
    ];
    onSubmit({ ...form, illnesses: allIllnesses.join(", ") }, photoFile);
  };

  const selectedDate = form.birthDate ? new Date(form.birthDate) : undefined;
  const agePreview = selectedDate ? calculateAge(selectedDate) : null;

  // Years for the dropdown (60–120 years ago)
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear - 60; y >= currentYear - 120; y--) yearOptions.push(y);

  const sectionLabel = (text: string) => (
    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 pb-1 border-b border-primary/20">{text}</p>
  );

  const RequiredStar = () => <span className="text-red-500 ml-0.5">*</span>;

  const FieldError = ({ field }: { field: keyof SeniorFormData }) =>
    touched[field] && errors[field] ? (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <span>⚠</span> {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">

          {/* Personal Information */}
          <div>
            {sectionLabel("Personal Information")}
            {/* Photo upload */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="relative w-16 h-16 rounded-full border-2 border-muted bg-muted overflow-hidden flex items-center justify-center cursor-pointer group shrink-0"
                onClick={() => fileRef.current?.click()}
              >
                {photoPreview
                  ? <img src={photoPreview} alt="photo" className="w-full h-full object-cover" />
                  : <User className="w-7 h-7 text-muted-foreground" />}
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

            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <Label className="text-xs">First Name<RequiredStar /></Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => { setForm({ ...form, firstName: e.target.value }); if (touched.firstName) setErrors(v => ({ ...v, firstName: e.target.value.trim() ? undefined : "First name is required." })); }}
                  onBlur={() => { touchField("firstName"); setErrors(v => ({ ...v, firstName: form.firstName.trim() ? undefined : "First name is required." })); }}
                  className={touched.firstName && errors.firstName ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                />
                <FieldError field="firstName" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name<RequiredStar /></Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => { setForm({ ...form, lastName: e.target.value }); if (touched.lastName) setErrors(v => ({ ...v, lastName: e.target.value.trim() ? undefined : "Last name is required." })); }}
                  onBlur={() => { touchField("lastName"); setErrors(v => ({ ...v, lastName: form.lastName.trim() ? undefined : "Last name is required." })); }}
                  className={touched.lastName && errors.lastName ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                />
                <FieldError field="lastName" />
              </div>
            </div>

            {/* DOB + Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date of Birth<RequiredStar /></Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onBlur={() => { touchField("birthDate"); if (!form.birthDate) setErrors(v => ({ ...v, birthDate: "Date of birth is required." })); }}
                      className={`flex items-center gap-2 w-full h-9 px-3 rounded-md border text-sm text-left transition-colors
                        bg-background
                        ${touched.birthDate && errors.birthDate
                          ? "border-red-500 focus:ring-red-500/30"
                          : "border-input hover:border-primary/50"}
                        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0`}
                    >
                      <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
                        {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select birth date"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom">
                    {/* Month/Year navigation header */}
                    <div className="flex items-center justify-between px-3 pt-3 pb-2 gap-2">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={() => setCalendarMonth(prev => {
                          const d = new Date(prev);
                          d.setMonth(d.getMonth() - 1);
                          return d;
                        })}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Month select */}
                      <select
                        value={getMonth(calendarMonth)}
                        onChange={(e) => setCalendarMonth(prev => setMonth(prev, Number(e.target.value)))}
                        className="text-xs font-medium bg-muted/50 border border-border rounded px-2 py-1 cursor-pointer focus:outline-none"
                      >
                        {MONTHS.map((m, i) => (
                          <option key={m} value={i}>{m}</option>
                        ))}
                      </select>

                      {/* Year select */}
                      <select
                        value={getYear(calendarMonth)}
                        onChange={(e) => setCalendarMonth(prev => setYear(prev, Number(e.target.value)))}
                        className="text-xs font-medium bg-muted/50 border border-border rounded px-2 py-1 cursor-pointer focus:outline-none"
                      >
                        {yearOptions.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={() => setCalendarMonth(prev => {
                          const d = new Date(prev);
                          d.setMonth(d.getMonth() + 1);
                          // Don't go past max allowed month
                          return d > MAX_BIRTH_DATE ? MAX_BIRTH_DATE : d;
                        })}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      onSelect={(date) => {
                        if (!date) return;
                        const iso = format(date, "yyyy-MM-dd");
                        setForm({ ...form, birthDate: iso });
                        touchField("birthDate");
                        const age = calculateAge(date);
                        setErrors(v => ({
                          ...v,
                          birthDate: age < 60 ? "Senior must be at least 60 years old." : age > 120 ? "Please enter a valid birth date." : undefined,
                        }));
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date > MAX_BIRTH_DATE || date < MIN_BIRTH_DATE}
                      initialFocus
                      // Hide the built-in header since we have our own
                      classNames={{
                        caption: "hidden",
                        nav: "hidden",
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {agePreview !== null && !errors.birthDate && (
                  <p className="text-xs text-muted-foreground">Age: {agePreview} yrs old</p>
                )}
                <FieldError field="birthDate" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Gender<RequiredStar /></Label>
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
                <Label className="text-xs">Address<RequiredStar /></Label>
                <Input
                  value={form.address}
                  onChange={(e) => { setForm({ ...form, address: e.target.value }); if (touched.address) setErrors(v => ({ ...v, address: e.target.value.trim() ? undefined : "Address is required." })); }}
                  onBlur={() => { touchField("address"); setErrors(v => ({ ...v, address: form.address.trim() ? undefined : "Address is required." })); }}
                  placeholder="Purok, Barangay, Municipality"
                  className={touched.address && errors.address ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                />
                <FieldError field="address" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Contact Number</Label>
                  <Input
                    value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    placeholder="09xxxxxxxxx"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Emergency Contact</Label>
                  <Input
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                    placeholder="Name & number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Socioeconomic Status */}
          <div>
            {sectionLabel("Socioeconomic Status")}
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

          {/* Submit button on mobile */}
          <div className="block md:hidden">
            <Button type="submit" className="w-full">{submitLabel}</Button>
          </div>
        </div>

        {/* RIGHT COLUMN — Medical Conditions */}
        <div className="flex flex-col gap-3">
          {sectionLabel("Medical Conditions")}
          <p className="text-xs text-muted-foreground -mt-2">Select all that apply. Health status will be assessed by AI agent.</p>
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
          <Button type="submit" className="w-full mt-auto hidden md:flex">{submitLabel}</Button>
        </div>

      </div>
    </form>
  );
};

export default SeniorForm;