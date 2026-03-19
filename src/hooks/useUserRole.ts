import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserRole() {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user_role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_user_role", { _user_id: user.id });
      if (error) return "staff";
      return data || "staff";
    },
    enabled: !!user,
  });

  return {
    role: role ?? "staff",
    isAdmin: role === "admin",
    isLoading,
  };
}
