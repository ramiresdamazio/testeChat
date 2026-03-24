import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifySocketIo from '@wick_studio/fastify-socket.io'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sequelize } from './config/database.js'
import userRoutes from './routes.js'
import { Message } from './models/message.js'
import { User } from './models/user.js'
import { Op } from 'sequelize'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({ logger: true })

fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../public')
})

fastify.register(fastifySocketIo)
fastify.register(userRoutes)


await fastify.ready()

const onlineUsers = new Map()

fastify.io.on('connection', (socket) => {
    fastify.log.info(`✅ Novo usuário conectado com sucesso: ${socket.id}`)

    // Escuta quando o frontend logar
    socket.on('entrar_chat', (usuario) => {
        onlineUsers.set(socket.id, usuario)
        fastify.io.emit('usuarios_online', Array.from(onlineUsers.values()))
    })

    socket.on('enviar_mensagem', async (dados) => {
        const { userId, content, replyToId } = dados
        const mensagemSalva = await Message.create({
            userId: userId,
            content: content,
            replyToId: replyToId || null
        })

        // Vamos melhorar a resposta para enviar o nome de quem mandou e o quote
        const mensagemCompleta = await Message.findByPk(mensagemSalva.id, {
            include: [
                { model: User, attributes: ['name'] },
                { 
                  model: Message, 
                  as: 'replyTo', 
                  include: [{ model: User, attributes: ['name'] }] 
                }
            ]
        })

        fastify.io.emit('nova_mensagem', mensagemCompleta)
    })

    socket.on('reagir_mensagem', async (dados) => {
        const { msgId, userId, emoji } = dados
        const mensagem = await Message.findByPk(msgId)
        if (!mensagem) return;

        const reacoesAtuais = mensagem.reactions || {}
        reacoesAtuais[userId] = emoji

        mensagem.reactions = reacoesAtuais
        mensagem.changed('reactions', true)
        await mensagem.save()

        const mensagemAtualizada = await Message.findByPk(msgId, {
            include: [
                { model: User, attributes: ['name'] },
                { 
                  model: Message, 
                  as: 'replyTo', 
                  include: [{ model: User, attributes: ['name'] }] 
                }
            ]
        })
        fastify.io.emit('nova_mensagem', mensagemAtualizada)
    })

    // --- Typing Indicators ---
    socket.on('digitando', (username) => {
        socket.broadcast.emit('usuario_digitando', username)
    })

    socket.on('parou_digitar', (username) => {
        socket.broadcast.emit('usuario_parou_digitar', username)
    })

    // Apaga o usuário quando ele fechar a aba
    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id)
        fastify.io.emit('usuarios_online', Array.from(onlineUsers.values()))
    })
})

try {
    await sequelize.authenticate()
    User.hasMany(Message, { foreignKey: 'userId' })
    Message.belongsTo(User, { foreignKey: 'userId' })
    
    // Auto-relacionamento para Respostas (Reply)
    Message.belongsTo(Message, { as: 'replyTo', foreignKey: 'replyToId' })
    
    await sequelize.sync({ alter: true })
    fastify.log.info("Banco de dados conectado ao fastify/io")
    
    // --- LIMPEZA AUTOMÁTICA (24H) ---
    async function cleanupOldMessages() {
        try {
            const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
            const deleted = await Message.destroy({
                where: {
                    createdAt: {
                        [Op.lt]: threshold
                    }
                }
            });
            if (deleted > 0) {
                console.log(`🧹 [CLEANUP] Removidas ${deleted} mensagens antigas (mais de 24h).`);
            }
        } catch (err) {
            console.error("Erro na limpeza automática:", err);
        }
    }

    // Executa agora ao iniciar e depois a cada 1 hora
    cleanupOldMessages();
    setInterval(cleanupOldMessages, 60 * 60 * 1000);

    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}