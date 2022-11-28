import { DiscordRequest } from "./utils.js";

export async function HasGuildCommands(appId, guildId, commands) {
  if (guildId === "" || appId === "") return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: "GET" });
    const data = await res.json();

    if (data) {
      const installedNames = data.map((c) => c["name"]);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command["name"])) {
        console.log(`Installing "${command["name"]}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(`"${command["name"]}" command already installed`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // install command
  try {
    await DiscordRequest(endpoint, { method: "POST", body: command });
  } catch (err) {
    console.error(err);
  }
}

export const SEND_MESSAGE_COMMAND = {
  name: "send_message",
  description: "Sent me a channel name",
  type: 1,
  options: [
    {
      type: 7,
      name: "channel",
      description: "pick you  favorite channel in the server",
      required: true,
      channel_types: [0],
    },
    {
      type: 3,
      name: "text",
      description: "type the message you want to sent to the other channel",
      required: false,
    },
    {
      type: 3,
      name: "imageurl",
      description: "enter url of image",
      required: false,
    },
    {
      type: 3,
      name: "buttontext",
      description: "enter text of the button",
      required: false,
    },
  ],
};
