const dataBase = async (sock, m, db) => {
    try {
        let isBlock = Object.values(await sock.fetchBlocklist()).includes(m.sender);
        let isNumber = v => typeof v == 'number' && !isNaN(v);
        let isBoolean = v => typeof v == 'boolean' && Boolean(v);

        if (isBlock) return
    
        let bot = db.data.settings[sock.user.jid];
        if (typeof bot != 'object') db.data.settings[sock.user.jid] = {};
    
        if (bot) {
            if (!('name' in bot)) bot.name = sock.user.name || await sock.getName(sock.user.jid);
            if (!isBoolean(bot.public)) bot.public = true;
            if (!isBoolean(bot.private)) bot.private = false;
            if (!isBoolean(bot.autobio)) bot.autobio = false;
            if (!isBoolean(bot.autorestart)) bot.autorestart = false;
            if (!isNumber(bot.bioTime)) bot.bioTime = 0;
            if (typeof bot.hit != 'object') bot.hit = [];
            if (!('language' in bot)) bot.language = null;
        } else {
            db.data.settings[sock.user.jid] = {
                name: sock.user.name || await sock.getName(sock.user.jid),
                public: true,
                private: false,
                autobio: false,
                autorestart: false,
                bioTime: 0,
                hit: [],
                language: null,
            };
        }
    } catch (e) {
    console.log(e);
  }
};

export { dataBase };