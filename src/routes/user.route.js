import { Router } from "express";
const router = Router();
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
 } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-accoutDetails").patch(verifyJWT, updateAccountDetails)


export {router}