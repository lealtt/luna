import { createPrefixCommand, createEmbed } from "#discord/creators";
import { colors } from "#utils";

createPrefixCommand({
  name: "gallery",
  aliases: ["gal", "me"],
  async run(message) {
    const { author, client } = message;

    // The "magic" of the createEmbed function:
    // When an array of URLs is passed to the 'image' property,
    // it automatically returns an array of EmbedBuilders,
    // formatted as a gallery.
    const embeds = createEmbed({
      color: colors.magenta,
      image: [
        author.displayAvatarURL({ size: 256 }),
        client.user.displayAvatarURL({ size: 256 }),
        "https://i.pinimg.com/originals/4f/ca/39/4fca39b356add857cdc1681d8278974c.gif",
      ],
      // Clickable Title:
      // If a 'title' is provided, it will automatically become a clickable link
      // to group the gallery images.
      // You can provide your own custom 'url' property to change this link.
      // If no 'url' is provided, a default is used.
      title: "Image Gallery",
      url: "https://my-custom-url.com", // This makes the title link to your custom URL
    });

    await message.reply({ embeds });
  },
});