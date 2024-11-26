import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

global.owner = {
	"number": "573234097278",
	"name": "Pineda"
}
global.bot = {
	"name": "ℕ𝕒𝕫𝕚~𝕓𝕠𝕥 𝕧𝕖𝕟𝕥𝕒𝕤",
	"image": "./nazi.jpg"
};

global.mods = ['51968374620', '573013116003'];

global.fake = `*_${bot.name} by ${owner.name}_*`
global.prefix = ['!', '?', '/', '.', '#'];
global.react = {
    setting: '⚙️',
	wait: '⏳',
	global: '✨',
	error: '❌'
}

global.supplier = {
	balance: 300,
    number: "573234097278"
}
global.name_sessions = 'auth/session'
global.metadata = {
	"reload": true
}

global.db = new Low(new JSONFile('db.json'), {
	chats: {},
	users: {},
	settings: {}
})

if (global.db.data == null) await global.db.read(); else await global.db.read();

if (global.db && typeof global.db.data == 'object') {
	setInterval(async () => {
		if (global.db.data) await global.db.write();
	}, 30 * 1000);
};