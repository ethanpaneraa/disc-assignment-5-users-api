import { supabase } from "../config/supabase";

export const getPublicImageUrl = (imageName: string): string => {
  const { data } = supabase.storage
    .from("disc-user-profile-pictures")
    .getPublicUrl(`profile-images/${imageName}`);
  return data.publicUrl;
};

export const createImagePath = (imageName: string) => {
  return `profile-images/${imageName}`;
};
