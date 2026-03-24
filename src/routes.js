import { User } from "./models/user.js";
import bcrypt from 'bcrypt'
import { Message } from "./models/message.js";

export default async function userRouts(fastify, options) {
    fastify.post('/cadastro', async (request, reply) => {
        try {
            const { name, email, password } = request.body
            const passwordHash = await bcrypt.hash(password, 10)
            const user = await User.create({
                name,
                email,
                password: passwordHash
            })
            return reply.code(201).send({
                message: 'Usuário criado com sucesso!',
                user: { id: user.id, name: user.name, email: user.email }
            })
        } catch (error) {
            console.error("Erro no cadastro:", error)
            if (error.name === 'SequelizeUniqueConstraintError') {
                return reply.code(400).send({ message: 'Este email já está em uso.' })
            }
            return reply.code(500).send({ message: 'Erro interno no servidor.' })
        }
    })

    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.body
        const user = await User.findOne({ where: { email } })
        if (!user) return reply.code(400).send({ message: 'Email ou senha inválidos' })
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return reply.code(400).send({ message: 'Email ou senha inválidos' })
        return reply.code(200).send({
            message: 'Login realizado',
            user: { id: user.id, name: user.name, email: user.email }
        })
    })

    fastify.get('/mensagens', async (request, reply) => {
        const messages = await Message.findAll({
            include: [
                { model: User, attributes: ['name'] },
                {
                    model: Message,
                    as: 'replyTo',
                    include: [{ model: User, attributes: ['name'] }]
                }
            ],
            order: [['createdAt', 'ASC']]
        })
        return reply.send(messages)
    })

    fastify.get('/limpar-chat', async (request, reply) => {
        await Message.destroy({ where: {} })
        return reply.send({ message: "O histórico do chat foi completamente apagado." })
    })
}
