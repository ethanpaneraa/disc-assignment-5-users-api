import { supabase } from "../config/supabase";
import { dummyData } from "../data/dummyData";
import { getPublicImageUrl } from "../utils/storageHelper";

const resetDatabase = async () => {
  try {
    console.log("Resetting the database...");
    console.log("Making sure that the users table exist....");
    await supabase.from("users").select("id").limit(1);
    console.log("Processing users with profile pictures...");

    const usersWithProfilePictures = dummyData.map((user) => {
      const imageName = user.profilePicture.split("/").pop()!;
      return {
        ...user,
        profilePicture: getPublicImageUrl(imageName),
      };
    });

    console.log("Deleting existing users...");
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .neq("id", 0);

    if (deleteError) throw deleteError;

    console.log("Inserting users with profile pictures...");
    const { data, error: insertError } = await supabase
      .from("users")
      .insert(usersWithProfilePictures)
      .select();

    if (insertError) throw insertError;

    console.log("Database reset complete!");
    console.log("Inserted users:", data);
  } catch (error) {
    console.log("Error with resetDatabase:", error);
  } finally {
    process.exit();
  }
};

resetDatabase();
