import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Heart, User, AlertTriangle, DollarSign, Home, Calendar } from "lucide-react";

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface SeniorProfileProps {
  senior: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    birth_date: string;
    gender: string;
    address: string;
    contact_number: string | null;
    emergency_contact?: string | null;
    health_status: string;
    illnesses: string[] | null;
    living_alone: boolean | null;
    living_status?: string;
    income_level?: string;
    photo?: string | null;
  };
}

const SeniorProfile = ({ senior }: SeniorProfileProps) => {
  const currentAge = calculateAge(senior.birth_date);

  const { data: records = [] } = useQuery({
    queryKey: ["assistance_records", senior.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assistance_records")
        .select("*")
        .eq("senior_id", senior.id)
        .order("date_given", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-muted bg-muted overflow-hidden flex items-center justify-center shrink-0">
          {senior.photo ? (
            <img src={senior.photo} alt="photo" className="w-full h-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{senior.first_name} {senior.last_name}</h3>
          <p className="text-sm text-muted-foreground">{senior.gender} · Age {currentAge} · Born {senior.birth_date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>{senior.address}</span>
        </div>
        {senior.contact_number && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{senior.contact_number}</span>
          </div>
        )}
        {senior.emergency_contact && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />
            <span>Emergency: {senior.emergency_contact}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Heart className="w-4 h-4 shrink-0" />
          <span>Health: {senior.health_status}</span>
        </div>
        {senior.illnesses && senior.illnesses.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Illnesses: {senior.illnesses.join(", ")}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Home className="w-4 h-4 shrink-0" />
          <span>{senior.living_status || (senior.living_alone ? "Living Alone" : "With Family")}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-4 h-4 shrink-0" />
          <span>Income: {senior.income_level || "N/A"}</span>
        </div>
      </div>

      {records.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Assistance History</h4>
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm text-foreground">{r.type}: {r.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {r.date_given}
                  </p>
                </div>
                <span className="text-sm font-medium text-foreground">₱{Number(r.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeniorProfile;
