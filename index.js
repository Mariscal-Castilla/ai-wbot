import "./config.js"
import pino from "pino"
import chalk from "chalk"
import { Boom } from "@hapi/boom"
import fs from "fs"
import { _prototype } from "./lib/_prototype.js"
import NodeCache from 'node-cache'
import readline from 'readline'
import mongoose from "mongoose"
import baileys, { DisconnectReason, makeInMemoryStore, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, getContentType, extractMessageContent, jidNormalizedUser, downloadMediaMessage } from "baileys";
import { exec } from "child_process"
import moment from 'moment-timezone'
import { format } from 'util'

import axios from 'axios'
// import sharp from 'sharp';

import { TEMPORARY_CONVERSATION } from "./models/temporary.js"
import { tiktok } from "./lib/scrapper"

const { proto } = baileys
const msgRetryCounterCache = new NodeCache()
const { state, saveCreds } = await useMultiFileAuthState(name_sessions)
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) })
const logger = pino({ level: "silent" })
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = text => new Promise(resolve => rl.question(text, resolve))

const start = async() => {
    const { version } = await fetchLatestBaileysVersion()

	let client = _prototype({
        version,
		logger: pino({ level: "silent" }),
		printQRInTerminal: false,
		mobile: false,
		browser: Browsers.ubuntu('Chrome'),
		auth: {
		    creds: state.creds,
		    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
		},
		msgRetryCounterCache,
		patchMessageBeforeSending: (message) => {
		    const requiresPatch = !!( message?.buttonsMessage || message?.templateMessage || message?.listMessage);
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
		},
	})
	
	store?.bind(client.ev);
	
	client.ev.on("creds.update", saveCreds)

	if(!client.authState.creds.registered) {
		const phoneNumber = await question(chalk.bold("Ingresa tu número de WhatsApp activo: "));
		const code = await client.requestPairingCode(phoneNumber);
		console.log(chalk.bold(`Emparejamiento con este código: ${code}`));
	}

	client.ev.on("connection.update", async({ connection, lastDisconnect}) => {
        const date = new Date()
        const Time = `${date.getHours()}:${date.getMinutes()}`
		if (connection == "close") {
			let reason = new Boom(lastDisconnect?.error)?.output?.statuscode
			if (reason == DisconnectReason.badSession) { console.log(chalk.bgRed(`[ ${Time} ] Se daño la carpeta ${global.name_sessions}, borre la carpeta y escanee el QR nuevamente.`)); process.exit(); }
			else if (reason == DisconnectReason.connectionClose) { console.log(chalk.bgRed(`[ ${Time} ] Se cerro la conexion conectando de nuevo`)); start(); }
			else if (reason == DisconnectReason.connectionLost) { console.log(chalk.bgRed(`[ ${Time} ] Se perdio la conexion con el servidor reconectando...`)); start(); }
			else if (reason == DisconnectReason.connectionReplaced) { console.log(chalk.bgRed(`[ ${Time} ] Se creo una nueva sesion y reemplazo la actual, revise y escanee nuevamente el QR`)); process.exit(); }
			else if (reason == DisconnectReason.loggedOut) { console.log(chalk.bgRed(`[ ${Time} ] El dispositivo se desvinculo, borre la carpeta ${info.name_sessions} y escanee el codigo QR nuevamente.`)); process.exit(); }
			else if (reason == DisconnectReason.restartRequire) { console.log(chalk.bgRed(`[ ${Time} ] Es necesario reiniciar, se reiniciara automaticamente aguarde...`)); start(); }
			else if (reason == DisconnectReason.timedOut) { console.log(chalk.bgRed(`[ ${Time} ] Se agoto el tiempo de espera, reconectando...`)); start(); }
			else { 
				console.log(chalk.bgRed(`[ ${Time} ] Error de desconexion desconocido: ${reason}||${connection}`))
			}
		} if (connection == "open") {
			mongoose.connect(`mongodb+srv://alexito:alexito1638@serverdatadb.39fv13g.mongodb.net/aiwbot?retryWrites=true&w=majority&appName=ServerDataDB`)
				.then(() => { console.log('Base de datos conectada') })
				.catch((e) => { console.error('Error al conectar con la base de datos: ', e) })
			console.log(`Sistema en linea.`);
		};
	});

	client.ev.on("messages.upsert", async m => {
		if(!m) return

		const v = m.messages[m.messages.length - 1]
		
		const from = v.key.remoteJid.startsWith('52') && v.key.remoteJid.charAt(2) !== '1' ? '52' + '1' + v.key.remoteJid .slice(2) : v.key.remoteJid
		const participant = from.endsWith("@g.us") ? (v.key.participant.startsWith('52') && v.key.participant.charAt(2) !== '1' ? '52' + '1' + v.key.participant .slice(2) : v.key.participant) : false
		
		const botNumber = client.user.id.split(':')[0] 
		const type = getContentType(v.message)
		const msg = extractMessageContent(v.message?.[type])
		const body = client.getMessageBody(type, msg)
		const quoted = (msg?.contextInfo && Object.keys(msg.contextInfo).some(i => i == "quotedMessage")) ? proto.WebMessageInfo.fromObject({ key: { remoteJid: from || v.key.remoteJid, fromMe: (msg.contextInfo.participant == client.user.jid), id: msg.contextInfo.stanzaId, participant: msg.contextInfo.participant }, message: msg.contextInfo.quotedMessage }) : false
		const sender = jidNormalizedUser(v.key.participant || v.key.remoteJid)
		const cmd = body && prefix.some(i => body.toLowerCase().startsWith(i.toLowerCase()))
		const command = cmd ? body.slice(prefix.find(prefix => body.toLowerCase().startsWith(prefix.toLowerCase())).length).trim().split(' ')[0].toLowerCase() : body.trim().split(' ')[0].toLowerCase()
		const args = body.slice(cmd ? prefix.find(prefix => body.toLowerCase().startsWith(prefix.toLowerCase())).length + command.length : command.length).trim().split(/ +/)

		const metadata = from.endsWith("@g.us") ? await client.groupMetadata(from) : false
		const expiration = msg?.extendedTextMessage?.contextInfo?.expiration ?? msg?.contextInfo?.expiration ?? null
		
		const Number = from.endsWith("@g.us") ? v.key.participant : from
		const isOwner = v.key.fromMe || (sender.replace("@s.whatsapp.net", "") === owner.number) || mods.some(i => i === sender.replace("@s.whatsapp.net", ""))

		let ulink = { 
			key: { 
				participant: "13135550002@s.whatsapp.net", 
				...(from ? { remoteJid: sender } : {}),
			},
			message: { 
				extendedTextMessage: { 
					text: "Somos la E.U.P.E.C"
				}
			}
			
		}

		const delay = async(ms) => { return new Promise(async(resolve) => setTimeout(resolve, ms)) }
		
		if (!client.autoread && v.message && command) {
            await delay(1 * 1000) 
            await client.sendPresenceUpdate('composing', from)
            client.readMessages([v.key])
        }

		
		/** TODO */
		switch (command) {
			case "tag": {
				if (!quoted) return
				if (!isOwner) return
				await client.sendMessage(from, { forward: quoted, contextInfo: { mentionedJid: metadata.participants.map((p) => p.id), remoteJid: from } })
				break
			}
			case "contacts": {
			    if (!isOwner) return
			    const { contacts } = JSON.parse(fs.readFileSync('json/contacts.json', 'utf8'))
			    if (!contacts?.length) {
			        return client.sendMessage(from, { text: "No se encontraron contactos en el archivo JSON." }, { quoted: ulink })
			    }
			    if (!quoted) return
			    let count = 0
			    for (const contact of contacts) {
			        const numberi = `51${contact}@s.whatsapp.net`
			        try {
			            await client.sendMessage(numberi, { forward: quoted }, { quoted: ulink })
			        } catch (error) {
			            client.sendMessage(from, { text: `Error al enviar mensaje a ${numberi}`})
			            console.error(`Error al enviar mensaje a ${numberi}`)
			        }
			        await new Promise(resolve => setTimeout(resolve, 5000))
			        count++
			    }
			    client.sendMessage(from, { text: `enviado a ${count}`})
				break
			}
			
			case "broadcast": {
			    if (!isOwner) return
				const groups = Object.entries(await client.groupFetchAllParticipating()).map(x => x[1])
					.filter(x => !x.announce)
					.filter(x => !x.isCommunityAnnounce)
					.map(x => x.id)
				
				let count = 0
				for (let id of groups) {
					await delay(1500)
					if (args.join(' ')) {
						await client.sendMessage(id, {
							text: args.join(' '),
							contextInfo: { mentionedJid: metadata.participants.map((p) => p.id), remoteJid: id }
						})
					}
					if (m.quoted) {
						await client.sendMessage(id, {
							forward: quoted,
							contextInfo: { mentionedJid: metadata.participants.map((p) => p.id), remoteJid: id }
						})
					}
					count++
				}
				client.sendMessage(from, { text: `enviado a ${count} grupos`})
				break
			}

			case "sotito": {
				let { data: prmpt } = await axios.get("https://raw.githubusercontent.com/al-e-dev/prompt/refs/heads/main/ai-wbot.txt")
                    
				if (type === "audioMessage") return client.sendMessage(from, { text: "Aun no podemos escuchar tu voz, vuelve cuando recibas una actualizacion." })
				if (type === "videoMessage" || type === "imageMessage" ) return client.sendMessage(from, { text: "Aun no podemos ver las imagenes vuelve cuando recibas una actualizacion." })
					
				let hist = await TEMPORARY_CONVERSATION.findOne({ user: Number })
			
				if (hist && new Date() > hist.expiry) {
					await TEMPORARY_CONVERSATION.deleteOne({ user: Number })
					hist = {
						user: Number,
						history: [],
						expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
					};
					client.sendMessage(from, { text: "Tu sesión anterior ha expirado. Hemos iniciado una nueva conversación." })
				}
			
				if (!hist) {
					hist = {
						user: Number,
						history: [],
						expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
					}
				}

				hist.history.push({ role: 'user', content: body })
			
				await TEMPORARY_CONVERSATION.updateOne(
					{ user: Number },
					{ history: hist.history, expiry: hist.expiry },
					{ upsert: true }
				)
			
				async function openai(hist) {
					let { data } = await axios.post("https://chateverywhere.app/api/chat/", {
						model: {
							id: "gpt-4o",
							name: "GPT-4o",
							maxLength: 32000,
							tokenLimit: 8000,
							completionTokenLimit: 5000,
							deploymentName: "gpt-4o"
						},
						messages: hist,
						prompt: prmpt,
						temperature: 0.5
					}, {
						headers: {
							"Accept": "application/json",
							"Content-Type": "application/json",
							"User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
						}
					})
					return data
				}
			
				const response = await openai(hist.history);
				hist.history.push({ role: 'assistant', content: response })
			
				await TEMPORARY_CONVERSATION.updateOne(
					{ user: Number },
					{ history: hist.history, expiry: hist.expiry },
					{ upsert: true }
				)
			
				client.sendMessage(from, { text: `${response}`, mentions: client.parseMention(body) })
				break
			}
			
			case "tiktok":
			case "tk":
			case "tik": {
			    if (!args.join(" ")) return
			    
			    const data = tiktok.download(args.join(" "))
			    
			    client.sendMessage(from, { video: { url: data.media.nowatermark.hd.play }, caption: "🍥 fetch"})
			    break
			}
			default: {
			    // DEFAULT INTELIGENCE
			    if (body && !from.endsWith("@g.us") && !v.key.fromMe) {
                    let { data: prmpt } = await axios.get("https://raw.githubusercontent.com/al-e-dev/prompt/refs/heads/main/ai-wbot.txt")

                    let hist = await TEMPORARY_CONVERSATION.findOne({ user: Number })
                
                    if (hist && new Date() > hist.expiry) {
                        await TEMPORARY_CONVERSATION.deleteOne({ user: Number })
                        hist = {
                            user: Number,
                            history: [],
                            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
                        };
                        client.sendMessage(from, { text: "Tu sesión anterior ha expirado. Hemos iniciado una nueva conversación." })
                    }
                
                    if (!hist) {
                        hist = {
                            user: Number,
                            history: [],
                            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
                        }
                    }

                    hist.history.push({ role: 'user', content: body })
                
                    await TEMPORARY_CONVERSATION.updateOne(
                        { user: Number },
                        { history: hist.history, expiry: hist.expiry },
                        { upsert: true }
                    )
                
                    async function openai(hist) {
                        let { data } = await axios.post("https://chateverywhere.app/api/chat/", {
                            model: {
                                id: "gpt-4o",
                                name: "GPT-4o",
                                maxLength: 32000,
                                tokenLimit: 8000,
                                completionTokenLimit: 5000,
                                deploymentName: "gpt-4o"
                            },
                            messages: hist,
                            prompt: prmpt,
                            temperature: 0.5
                        }, {
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json",
                                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                            }
                        })
                        return data
                    }
                
                    const response = await openai(hist.history);
                    hist.history.push({ role: 'assistant', content: response })
                
                    await TEMPORARY_CONVERSATION.updateOne(
                        { user: Number },
                        { history: hist.history, expiry: hist.expiry },
                        { upsert: true }
                    )
                
                    client.sendMessage(from, { text: `${response}`, mentions: client.parseMention(body) })
        		}
	
			    if (body.startsWith('$')) {
					if(!isOwner) return
					exec(args.join(' '), (error, stdout, stderr) => {
						if (error) return client.sendMessage(from, { text: `${error.message}`}, { quoted: ulink })
						if (stderr) return client.sendMessage(from, { text: `${stderr}`}, { quoted: ulink })
						client.sendMessage(from, { text: `${stdout}`}, { quoted: ulink })
					})
				}
				if (body.startsWith('_')) {
					if(!isOwner) return
					let evan
					let text = /await|return/gi.test(body) ? `(async () => { ${body.slice(1)} })()` : `${body.slice(1)}`
					try {
						evan = await eval(text)
					} catch (e) {
						evan = e
					} finally {
						client.sendMessage(from, { text: format(evan)}, { quoted: ulink })
					}
				}
			}
		}
	})
	
	return client
}

start().catch(_ => console.log(_))