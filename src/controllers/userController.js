"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserByID = exports.getAllUsers = exports.createUser = void 0;
const supabase_1 = require("../config/supabase");
const storageHelper_1 = require("../utils/storageHelper");
const BUCKET_NAME = "disc-user-profile-pictures";
class FileUploadError extends Error {
    constructor(message) {
        super(message);
        this.name = "FileUploadError";
    }
}
const uploadProfilePicture = (imageFile) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timestamp = Date.now();
        const fileExtension = imageFile.originalname.split(".").pop();
        const baseFileName = `${timestamp}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExtension}`;
        const fullPath = (0, storageHelper_1.createImagePath)(baseFileName);
        console.log("Generated file path:", fullPath);
        const { data, error: uploadError } = yield supabase_1.supabase.storage
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
    }
    catch (error) {
        console.log("Error in uploadProfilePicture:", error);
        if (error instanceof Error) {
            throw new FileUploadError(error.message);
        }
        throw new FileUploadError("Failed to upload the file");
    }
});
const deleteProfilePicture = (imageURL) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = imageURL.split("/").pop();
    if (fileName) {
        const { error } = yield supabase_1.supabase.storage
            .from(BUCKET_NAME)
            .remove([(0, storageHelper_1.createImagePath)(fileName)]);
        if (error) {
            console.log("Error in deleteProfilePicture:", error);
        }
    }
});
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting user creation....");
        const { firstName, lastName, email, bio, major, graduationYear } = req.body;
        const imageFile = req.file;
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
        let imageURL = null;
        if (imageFile) {
            try {
                console.log("Attempting to upload profile picture....");
                const fileName = yield uploadProfilePicture(imageFile);
                imageURL = (0, storageHelper_1.getPublicImageUrl)(fileName);
                console.log("Profile picture uploaded successfully:", imageURL);
            }
            catch (error) {
                if (error instanceof FileUploadError) {
                    res.status(500).json({
                        error: "Failed to upload profile picture",
                        details: error.message,
                    });
                }
                else {
                    res.status(500).json({
                        error: "Failed to upload profile picture",
                        details: "An unknown error occurred",
                    });
                }
                return;
            }
        }
        console.log("Creating user in database....");
        const { data, error } = yield supabase_1.supabase
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
    }
    catch (error) {
        console.log("Error in createUser:", error);
        res.status(500).json({
            error: "Failed to create user",
            details: error instanceof Error ? error.message : "An unknown error occurred",
        });
    }
});
exports.createUser = createUser;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, error } = yield supabase_1.supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        console.log("Error in getAllUsers:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
exports.getAllUsers = getAllUsers;
const getUserByID = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { data, error } = yield supabase_1.supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();
        if (error)
            throw error;
        if (!data) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(data);
    }
    catch (error) {
        console.log("Error in getUserByID:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});
exports.getUserByID = getUserByID;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, bio, major, graduationYear } = req.body;
        const imageFile = req.file;
        if (!firstName || !lastName || !email) {
            res
                .status(400)
                .json({ error: "First name, last name, and email are required" });
            return;
        }
        const { data: existingUser, error: fetchError } = yield supabase_1.supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();
        let imageURL = null;
        if (imageFile) {
            const fileName = yield uploadProfilePicture(imageFile);
            imageURL = (0, storageHelper_1.getPublicImageUrl)(fileName);
            if (existingUser === null || existingUser === void 0 ? void 0 : existingUser.profilePicture) {
                yield deleteProfilePicture(existingUser.profilePicture);
            }
        }
        const updateData = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (firstName && { firstName })), (lastName && { lastName })), (email && { email })), (bio && { bio })), (major && { major })), (graduationYear && { graduationYear })), (imageURL && { profilePicture: imageURL }));
        const { data, error } = yield supabase_1.supabase
            .from("users")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        if (!data) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(data);
    }
    catch (error) {
        console.log("Error in updateUser:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { data: user } = yield supabase_1.supabase
            .from("users")
            .select("profilePicture")
            .eq("id", id)
            .single();
        const { error } = yield supabase_1.supabase.from("users").delete().eq("id", id);
        if (error)
            throw error;
        if (user === null || user === void 0 ? void 0 : user.profilePicture) {
            yield deleteProfilePicture(user.profilePicture);
        }
        res.status(204).send();
    }
    catch (error) {
        console.log("Error in deleteUser:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});
exports.deleteUser = deleteUser;
