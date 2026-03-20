import { User } from "./models/user.js";
import bcrypt from 'bcrypt'

export default async function userRouts(fastify, options) {
    fastify.post('/cadastro', async (request, reply) => {
        const { name, email, password } = request.body
        const passwordHash = await bcrypt.hash(password, 10)
        const user = await User.create({
            name,
            email,
            password: passwordHash
        })
        return reply.code(201).send(user)
    })

    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.body
        const user = await User.findOne({ where: { email } })
        if (!user) return reply.code(400).send({ message: 'Email ou senha inválidos' })
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return reply.code(400).send({ message: 'Email ou senha inválidos' })
        return reply.code(200).send({ message: 'Login realizado' })
    })
}
