import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch the profile (including the mantra)
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateMantra = useMutation({
    mutationFn: async (newMantra: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ mantra: newMantra })
        .eq("id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const updateTagLibrary = useMutation({
    mutationFn: async (tags: string[]) => {
      const { error } = await supabase
        .from("profiles")
        .update({ tag_library: tags.length ? tags : null })
        .eq("id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  return { profile, isLoading, updateMantra, updateTagLibrary };
};