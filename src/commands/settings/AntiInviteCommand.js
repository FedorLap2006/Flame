const { MessageEmbed } = require('discord.js');
const FlameCommand = require('../../structures/FlameCommand');
const Constants = require('../../utils/Constants');

class AntiInviteCommand extends FlameCommand {
  constructor() {
    super('anti-invite', {
      description: 'Настройки модуля защиты от сторонних приглашений.',
      category: 'settings',
      usage: 'anti-invite [toggle/message/whitelist/reset]',
      aliases: ['antiinvite'],
      userPermissions: ['MANAGE_GUILD'],
    });
  }

  async run(message, args) {
    const data = await message.client.database.collection('guilds').findOne({ guildID: message.guild.id });
    const option = args[0];

    switch (option) {
      case 'toggle':
        message.client.database.collection('guilds').updateOne({ guildID: message.guild.id }, {
          $set: {
            'antiInvite.enabled': !data.antiInvite.enabled,
          },
        });
        message.channel.send(`✅ Защита от приглашений была успешно **${data.antiInvite.enabled ? 'отключена' : 'включена'}** на данном сервере.`);
        break;
      case 'message':
        if (!data.antiInvite.enabled) return message.reply('На данном сервере ещё не включена защита от приглашений. Включите её прежде чем настраивать другие параметры :no_entry:');
        // eslint-disable-next-line
        const msg = args.slice(1).join(' ');
        if (!msg) return message.reply('Укажите пожалуйста новое сообщение :no_entry:');

        message.client.database.collection('guilds').updateOne({ guildID: message.guild.id }, {
          $set: {
            'antiInvite.message': msg.slice(0, 999),
          },
        });
        message.channel.send('✅ Сообщение было успешно отредактировано.');
        break;
      case 'reset':
        message.client.database.collection('guilds').updateOne({ guildID: message.guild.id }, {
          $set: {
            'antiInvite.message': null,
            'antiInvite.whitelist': [],
          },
        });
        message.channel.send('✅ Настройки модуля были успешно сброшены.');
        break;
      case 'whitelist':
        // eslint-disable-next-line
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

        if (!role) return message.reply('Укажите пожалуйста роль, которая будет добавлена в белый список :no_entry:');
        if (!message.guild.roles.cache.has(role.id)) return message.reply('Указанной вами роли не существует на данном сервере :no_entry:');
        if (role.id === message.guild.id) return message.reply('Вы не можете добавить данную роль в белый список :no_entry:');

        if (data.antiInvite.whitelist.includes(role.id)) {
          message.client.database.collection('guilds').updateOne({ guildID: message.guild.id }, {
            $pull: {
              'antiInvite.whitelist': role?.id,
            },
          });
          message.channel.send(`✅ Роль **${role.name}** была успешно убрана с белого списка.`);
        } else {
          message.client.database.collection('guilds').updateOne({ guildID: message.guild.id }, {
            $push: {
              'antiInvite.whitelist': role?.id,
            },
          });
          message.channel.send(`✅ Роль **${role.name}** была успешно добавлена в белый список.`);
        }
        break;
      default:
        message.channel.send(
          new MessageEmbed()
            .setAuthor('Защита от сторонних приглашений', Constants.static.MODULE_GRAY)
            .setColor(data.antiInvite.enabled ? '#a5ff2a' : '#ff3333')
            .setDescription(`На данном сервере **${data.antiInvite.enabled ? 'активирована' : 'не активирована'}** защита от сторонних приглашений.`)
            .addField('Сообщение', data.antiInvite.message ? `\`\`\`${data.antiInvite.message}\`\`\`` : 'Сообщение не установлено.')
            .addField('Настройка модуля', 'Подробную справку по настройке данной системы вы сможете получить на [этой странице](https://docs.flamebot.ru/ablities/auto-moderation).')
            .setFooter(message.guild.name, message.guild.iconURL())
            .setTimestamp(),
        );
    }
  }
}

module.exports = AntiInviteCommand;
