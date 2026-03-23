import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifySocketIo from '@wick_studio/fastify-socket.io'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sequelize } from './config/database.js'
import userRoutes from './routes.js'
import { Message } from './models/message.js'
import { User } from './models/user.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({ logger: true })

fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../public')
})

fastify.register(fastifySocketIo)
fastify.register(userRoutes)

fastify.get('/', async function handler(request, reply) {
    return { hello: 'world' }
})

await fastify.ready()

fastify.io.on('connection', (socket) => {
    fastify.log.info(`✅ Novo usuário conectado com sucesso: ${socket.id}`)
    socket.on('enviar_mensagem', async (dados) => {
        const { userId, content } = dados
        const mensagemSalva = await Message.create({
            userId: '123',
            content: 'teste'
        })
        fastify.io.emit('testando', mensagemSalva)
    })
})

try {
    await sequelize.authenticate()
    User.hasMany(Message, { foreignKey: 'userId' })
    Message.belongsTo(User, { foreignKey: 'userId' })
    await sequelize.sync()
    fastify.log.info("Banco de dados conectado ao fastify/io")
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}