import { RequestHandler } from "express";
import { supabase } from "../config/supabase";
import { UserParams, CreateUserBody, UpdateUserBody } from "../types/user";
import { getPublicImageUrl, createImagePath } from "../utils/storageHelper";

const BUCKET_NAME = "disc-user-profile-pictures";

class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileUploadError";
  }
}

const uploadProfilePicture = async (
  imageFile: Express.Multer.File
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileExtension = imageFile.originalname.split(".").pop();
    const baseFileName = `${timestamp}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExtension}`;
    const fullPath = createImagePath(baseFileName);
    console.log("Generated file path:", fullPath);

    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, imageFile.buffer, {
        contentType: imageFile.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.log("Upload error:", uploadError);
      throw new FileUploadError("Failed to upload the file");
    }

    console.log("Upload result:", data);
    return fullPath;
  } catch (error) {
    console.log("Error in uploadProfilePicture:", error);
    if (error instanceof Error) {
      throw new FileUploadError(error.message);
    }
    throw new FileUploadError("Failed to upload the file");
  }
};

const deleteProfilePicture = async (imageURL: string) => {
  const fileName = imageURL.split("/").pop();
  if (fileName) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([createImagePath(fileName)]);
    if (error) {
      console.log("Error in deleteProfilePicture:", error);
    }
  }
};

export const createUser: RequestHandler = async (req, res) => {
  try {
    console.log("Starting user creation....");
    const { firstName, lastName, email, bio, major, graduationYear } =
      req.body as CreateUserBody;
    const imageFile = req.file as Express.Multer.File;

    console.log("Request body:", req.body);
    console.log("Image file received:", imageFile ? "Yes" : "No");

    if (!imageFile) {
      res.status(400).json({ error: "Profile picture is required" });
      return;
    }

    if (!firstName || !lastName || !email) {
      res.status(400).json({
        error: "First name, last name, and email are required",
      });
      return;
    }

    let imageURL: string | null = null;
    if (imageFile) {
      try {
        console.log("Attempting to upload profile picture....");
        const fileName = await uploadProfilePicture(imageFile);
        imageURL = getPublicImageUrl(fileName);
        console.log("Profile picture uploaded successfully:", imageURL);
      } catch (error) {
        if (error instanceof FileUploadError) {
          res.status(500).json({
            error: "Failed to upload profile picture",
            details: error.message,
          });
        } else {
          res.status(500).json({
            error: "Failed to upload profile picture",
            details: "An unknown error occurred",
          });
        }
        return;
      }
    }

    console.log("Creating user in database....");
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          firstName,
          lastName,
          email,
          bio,
          major,
          graduationYear,
          profilePicture: imageURL,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("Error in createUser:", error);
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    console.log("User created successfully:", data);
    res.status(201).json(data);
  } catch (error) {
    console.log("Error in createUser:", error);
    res.status(500).json({
      error: "Failed to create user",
      details:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
};

export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.log("Error in getAllUsers:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserByID: RequestHandler<UserParams> = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(data);
  } catch (error) {
    console.log("Error in getUserByID:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, bio, major, graduationYear } =
      req.body as UpdateUserBody;
    const imageFile = req.file as Express.Multer.File;

    if (!firstName || !lastName || !email) {
      res
        .status(400)
        .json({ error: "First name, last name, and email are required" });
      return;
    }

    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    let imageURL: string | null = null;
    if (imageFile) {
      const fileName = await uploadProfilePicture(imageFile);
      imageURL = getPublicImageUrl(fileName);

      if (existingUser?.profilePicture) {
        await deleteProfilePicture(existingUser.profilePicture);
      }
    }

    const updateData: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      bio: string;
      major: string;
      graduationYear: number;
      profilePicture: string;
    }> = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(bio && { bio }),
      ...(major && { major }),
      ...(graduationYear && { graduationYear }),
      ...(imageURL && { profilePicture: imageURL }),
    };

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(data);
  } catch (error) {
    console.log("Error in updateUser:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

export const deleteUser: RequestHandler<UserParams> = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: user } = await supabase
      .from("users")
      .select("profilePicture")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;
    if (user?.profilePicture) {
      await deleteProfilePicture(user.profilePicture);
    }
    res.status(204).send();
  } catch (error) {
    console.log("Error in deleteUser:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};
