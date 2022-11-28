import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";

import fetch from "node-fetch";

import { DiscordRequest } from "../utils.js";
import { reqInfoModel } from "../models/reqInfoModel.js";

export default async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === "send_message") {
      //acknoledge the interaction first itself since the webhook will only wait for 3secs to get the first reply
      await res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      });
      //needed data: sender,the image

      const userId = req.body.member.user.id;
      const userName = req.body.member.user.username;
      const serverId = req.body.guild_id;

      //find server name
      let endpoint = `guilds/${serverId}`;
      const result = await DiscordRequest(endpoint, { method: "GET" });
      const data = await result.json();
      const servername = data.name;

      //upload to db

      try {
        await reqInfoModel.create({
          userId: userId,
          username: userName,
          serverId: serverId,
          servername: servername,
        });
      } catch (err) {
        console.error(err);
      }

      //get data from user request
      const messageObject = {};
      const options = req.body.data.options;

      //find the corresponding channel id and build the message to be sent
      let neededChannelId;
      let invalidimgurl = false;
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.name == "channel") {
          neededChannelId = option.value;
        } else if (option.name == "text") {
          messageObject.content = option.value;
        } else if (option.name == "imageurl") {
          let imgurl = option.value;
          if (imgurl.match(/^http.*\.(jpeg|jpg|gif|png)$/) == null) {
            if (imgurl.match(/^https.*\.(jpeg|jpg|gif|png)$/) == null) {
              invalidimgurl = true;
              continue;
            }
          }

          const imgresponse = await fetch(imgurl);
          if (!imgresponse.ok) {
            invalidimgurl = true;
            continue;
          }
          try {
            const restype = imgresponse.headers.get("Content-Type");
            if (restype.indexOf("image") === -1) {
              invalidimgurl = true;
              continue;
            }
          } catch (error) {
            invalidimgurl = true;
            continue;
          }

          messageObject.embeds = [
            {
              image: {
                url: option.value,
              },
            },
          ];
        } else if (option.name == "buttontext") {
          messageObject.components = [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  label: option.value,
                  style: ButtonStyleTypes.PRIMARY,
                  custom_id: "msgButton",
                },
              ],
            },
          ];
        }
      }

      //sent the message to the requested channel
      const interactionToken = req.body.token;
      const endpointDele = `/webhooks/${process.env.APP_ID}/${interactionToken}/messages/@original`;
      endpoint = `/channels/${neededChannelId}/messages`;

      if (Object.keys(messageObject).length === 0) {
        await DiscordRequest(endpointDele, {
          method: "PATCH",
          body: { content: "Provide atleast one argument" },
        });
        return;
        /*
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Provide atleast one argument as message",
          },
        });
        return;
        */
      }

      await DiscordRequest(endpoint, { method: "POST", body: messageObject });

      //send reply to the request
      if (invalidimgurl == false) {
        await DiscordRequest(endpointDele, {
          method: "PATCH",
          body: { content: "Check the channel" },
        });
      } else {
        await DiscordRequest(endpointDele, {
          method: "PATCH",
          body: { content: "Provide valid image URL" },
        });
      }

      if (invalidimgurl == false) {
        await DiscordRequest(endpointDele, { method: "DELETE" });
      }
      return;
    }
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    // delete action to be performed if clicked on the button
    const componentId = data.custom_id;

    if (componentId == "msgButton") {
      const channelId = req.body.channel_id;
      const messageId = req.body.message.id;
      const endpoint = `channels/${channelId}/messages/${messageId}`;
      try {
        await DiscordRequest(endpoint, { method: "DELETE" });
      } catch (err) {
        console.log(err);
      }

      await res.send({
        type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
      });
      return;
    }
  }
}
