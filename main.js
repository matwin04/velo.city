import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { engine } from "express-handlebars";
import session from 'express-session';
import { fileURLToPath } from "url";
import { sql, setupDB } from "./db.js";
import bcrypt from "bcrypt";
dotenv.config();
console.log(process.env.NODE_ENV);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const VIEWS_DIR = path.join(__dirname, "views");
const PARTIALS_DIR = path.join(VIEWS_DIR, "partials");
const PUBLIC_DIR = path.join(__dirname, "public");
const upload = multer();
const PORT = process.env.PORT || 3003;

// Template engine
app.engine("html", engine({ extname: ".html", defaultLayout: false, partialsDir: PARTIALS_DIR }));
app.set("view engine", "html");
app.set("views", VIEWS_DIR);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(PUBLIC_DIR));
app.use(
    session({
        secret: process.env.SESSION_SECRET || "thing-secret",
        resave: false,
        saveUninitialized: true,
    })
);
// DB Function

setupDB();
// Routes
app.get("/", (req, res) => {
    res.render("index", { title: "Thing Token" });
});
/*app.get("/admin", (req, res) => {
    res.render("admin", { title: "About" });
});*/

// API: ARTICLES
app.get("/api/articles", async (req, res) => {
    try {
        const articles = await sql`
            SELECT * FROM articles ORDER BY id DESC
        `;
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch articles" });
    }
});
// API: LINKS
app.get("/api/links", async (req, res) => {
    try {
        const links = await sql`
            SELECT * FROM links ORDER BY id ASC
        `;
        res.json(links);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch links" });
    }
});
app.get("/links", async (req, res) => {
    const chats = await sql`SELECT * FROM links`;
    res.json(chats);
});
app.get("/articles", async (req, res) => {
    const chats = await sql`SELECT * FROM articles`;
    res.json(chats);
});
app.get("/chat/:id", async (req, res) => {
    const id = req.params.id;
    const chat = await sql(`SELECT * FROM chatposts WHERE id = ${id}`);
    res.render("chat", { title: "Chat", chat: chat });
});
app.get("/news", async (req, res) => {
    res.render("news", { title: "Misato" });
});
app.post("/api/links", async (req, res) => {
    const { title, url, icon } = req.body;

    try {
        await sql`
            INSERT INTO links (title, url, icon)
            VALUES (${title}, ${url}, ${icon})
        `;

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add link" });
    }
});
app.post("/api/articles", async (req, res) => {
    const { title, url, icon, publisher } = req.body;

    try {
        await sql`
            INSERT INTO articles (title, url, icon, publisher)
            VALUES (${title}, ${url}, ${icon}, ${publisher})
        `;

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add article" });
    }
});
app.get("/contact", (req, res) => {
    res.render("contact", { title: "Contact Us" });
});
app.get("/signup", (req, res) => {
    res.render("user/signup",{title:"SignUp"});
});
app.get("/login", (req, res) => {
    res.render("user/login", { title: "Login" });
});
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});
app.get("/profile/:username", async (req, res) => {
    const username = req.params.username;
    const user = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (user.length === 0) return res.status(404).send("User not found");
    res.render("user", { username });
});


//API Functions
app.post("/api/signup",async (req, res) => {
    const {username,email,password} = req.body;
    if (!username||!password||!email) return res.status(400).send("Username is required");
    const hashedPassword = await bcrypt.hash(password, 12);
    try {
        await sql `INSERT INTO users (username,email,password_hash) VALUES (${username},${email},${hashedPassword})`;
        res.status(201).json({message:"User Created"});
    } catch (err) {
        res.status(400).json({error:"User Allready Created"});
    }
});
app.post("/api/login",async(req,res)=>{
    const {email,password}=req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing Credentials" });

    const user = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (user.length === 0) return res.status(400).json({ error: "User Not Found" });

    const isValidPassword = await bcrypt.compare(password, user[0].password_hash);
    if (!isValidPassword) return res.status(401).json({ error: "Invalid Password" });

    req.session.user = { id: user[0].id, username: user[0].username };
    res.json({ message: "Login Successful", username: user[0].username });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});