import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifySocketIo from '@wick_studio/fastify-socket.io'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sequelize } from './config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({ logger: true })

fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../public')
})

fastify.register(fastifySocketIo)

fastify.get('/', async function handler(request, reply) {
    return { hello: 'To vivo muleke' }
})

await fastify.ready()

fastify.io.on('connection', (socket) => {
    fastify.log.info(`✅ Novo usuário conectado com sucesso: ${socket.id}`)
})

try {
    await sequelize.authenticate()
    fastify.log.info("Banco de dados conectado ao fastify/io")
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}
