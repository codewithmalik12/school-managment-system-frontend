import { Router } from "express";

const router = Router();


router.get("/login", (req, res) => {
    res.send("SmsLogin");
});

router.get("/register", (req, res) => {
    res.send("Register");
});

export default router;
