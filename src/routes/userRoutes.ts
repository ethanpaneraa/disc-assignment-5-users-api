import express from "express";
import multer from "multer";
import {
  getAllUsers,
  getUserByID,
  createUser,
  deleteUser,
  updateUser,
} from "../controllers/userController";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", getAllUsers);
router.get("/:id", getUserByID);
router.post("/", upload.single("profilePicture"), createUser);
router.put("/:id", upload.single("profilePicture"), updateUser);
router.delete("/:id", deleteUser);

export default router;
