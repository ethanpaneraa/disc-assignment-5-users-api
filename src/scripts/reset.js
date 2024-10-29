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
const supabase_1 = require("../config/supabase");
const dummyData_1 = require("../data/dummyData");
const storageHelper_1 = require("../utils/storageHelper");
const resetDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Resetting the database...");
        console.log("Making sure that the users table exist....");
        yield supabase_1.supabase.from("users").select("id").limit(1);
        console.log("Processing users with profile pictures...");
        const usersWithProfilePictures = dummyData_1.dummyData.map((user) => {
            const imageName = user.profilePicture.split("/").pop();
            return Object.assign(Object.assign({}, user), { profilePicture: (0, storageHelper_1.getPublicImageUrl)(imageName) });
        });
        console.log("Deleting existing users...");
        const { error: deleteError } = yield supabase_1.supabase
            .from("users")
            .delete()
            .neq("id", 0);
        if (deleteError)
            throw deleteError;
        console.log("Inserting users with profile pictures...");
        const { data, error: insertError } = yield supabase_1.supabase
            .from("users")
            .insert(usersWithProfilePictures)
            .select();
        if (insertError)
            throw insertError;
        console.log("Database reset complete!");
        console.log("Inserted users:", data);
    }
    catch (error) {
        console.log("Error with resetDatabase:", error);
    }
    finally {
        process.exit();
    }
});
resetDatabase();
