"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
router.get("/", userController_1.getAllUsers);
router.get("/:id", userController_1.getUserByID);
router.post("/", upload.single("profilePicture"), userController_1.createUser);
router.put("/:id", upload.single("profilePicture"), userController_1.updateUser);
router.delete("/:id", userController_1.deleteUser);
exports.default = router;
