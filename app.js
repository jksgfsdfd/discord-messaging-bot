import express from "express";
import("express-async-errors");
const mongoose = import("mongoose");
import { notFound } from "./middlewares/notfound.js";
import * as dotenv from "dotenv";
dotenv.config();

import { SEND_MESSAGE_COMMAND, HasGuildCommands } from "./commands.js";

import { connectDB } from "./db/connectdb.js";

import { default as interactionsRouter } from "./router/interactionsrouter.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("WELCOME TO SEND_MESSAGE APP");
});
app.use("/interactions", interactionsRouter);
app.use(notFound);

async function start() {
  try {
    console.log(process.env.APP_ID);
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, async () => {
      console.log("Listening on port..", PORT);
      // Check if guild commands from commands.json are installed (if not, install them)
      HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
        SEND_MESSAGE_COMMAND,
      ]);
    });
  } catch (err) {
    console.error(err);
    return;
  }
}

start();
