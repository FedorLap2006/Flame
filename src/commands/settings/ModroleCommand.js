const { getHelp } = require('../../utils/Functions');
const FlameCommand = require('../../structures/FlameCommand');

class ModroleCommand extends FlameCommand {
  constructor() {
    super('modrole', {
      description: 'Установить роль модератора на сервере.',
      category: 'settings',
      aliases: [],
      usage: 'modrole [reset/set <Роль>]',
      userPermissions: ['MANAGE_GUILD'],
    });
  }

  async run(message, args) {
    const data = await message.client.database.collection('guilds').findOne({ guildID: message.guild.id });
    const option = args[0];

    switch (option) {
      case 'set':
        // eslint-disable-next-line no-case-declarations
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) return getHelp(message, this.name);
        if (!message.guild.roles.cache.has(role.id)) return message.reply('Указанной вами роли не существует на данном сервере :no_entry:');

        message.client.database.collection('guilds').updateOne({ guildID: message.guild.id }, {
          $set: {
            moderator: role.id,
          },
        });
        message.channel.send(`✅ Роль модератора была успешно установлена на ${role} (${role.id})`);
        break;
      case 'reset':
        if (!data.moderator) return message.reply('На данном сервере не установлена роль модератора.');

        message.client.database.collection('guilds').updateOne({ guildID: message.guild.id }, {
          $set: {
            moderator: null,
          },
        });
        message.channel.send('✅ Роль модератора была успешно сброшена.');
        break;
      default:
        return message.channel.send(data.moderator
          ? `Роль модератора на данном сервере установлена на <@&${data.moderator}> (${data.moderator})\nСбросить ее можно командой \`${data.prefix}modole reset\`.`
          : `На данном сервере еще не установлена роль модератора.\nВы всегда можете установить ее командой \`${data.prefix}modrole set\`.`,
        );
    }
  }
}

module.exports = ModroleCommand;
