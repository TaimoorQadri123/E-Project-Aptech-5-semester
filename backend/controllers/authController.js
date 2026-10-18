import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";
import { validateSignupBody, userToJSON } from "../utils/userValidation.js";
import { deleteProfileFile } from "../utils/fileHelpers.js";

export async function signupController(req, res) {
  let uploadedPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Profile picture is required (JPG, PNG or WEBP, max 2 MB)" });
    }

    uploadedPath = `/uploads/${req.file.filename}`;

    const check = validateSignupBody(req.body);
    if (!check.ok) {
      deleteProfileFile(uploadedPath);
      return res.status(400).json({ status: "error", message: check.message });
    }

    const { username, email, password } = check.data;

    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      deleteProfileFile(uploadedPath);
      return res.status(400).json({ status: "error", message: "An account with this email already exists" });
    }

    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      deleteProfileFile(uploadedPath);
      return res.status(400).json({ status: "error", message: "This name is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({
      username,
      email,
      password: hashedPassword,
      profilePicture: uploadedPath,
    });

    return res.status(201).json({ status: "success", message: "Account created successfully" });
  } catch (error) {
    if (uploadedPath) deleteProfileFile(uploadedPath);
    if (error.code === 11000) {
      return res.status(400).json({ status: "error", message: "Email or name already exists" });
    }
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
}

export async function loginController(req, res) {
  try {
    const login =
      typeof req.body.login === "string"
        ? req.body.login.trim().toLowerCase()
        : typeof req.body.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";
    const password = req.body.password || "";

    if (!login || !password) {
      return res.status(400).json({ status: "error", message: "Name or email and password are required" });
    }

    const query = login.includes("@") ? { email: login } : { username: login };
    const user = await UserModel.findOne(query).select("+password");
    if (!user) {
      return res.status(404).json({ status: "error", message: "Account not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ status: "error", message: "Incorrect password" });
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.SECRETKEY, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      user: userToJSON(user),
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
}

export function logoutController(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(200).json({ status: "success", message: "Logged out successfully" });
}

export async function meController(req, res) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }
    return res.status(200).json({ status: "success", data: userToJSON(user) });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
}
