"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImagePath = exports.getPublicImageUrl = void 0;
const supabase_1 = require("../config/supabase");
const getPublicImageUrl = (imageName) => {
    const { data } = supabase_1.supabase.storage
        .from("disc-user-profile-pictures")
        .getPublicUrl(`profile-images/${imageName}`);
    return data.publicUrl;
};
exports.getPublicImageUrl = getPublicImageUrl;
const createImagePath = (imageName) => {
    return `profile-images/${imageName}`;
};
exports.createImagePath = createImagePath;
