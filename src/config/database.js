import { Sequelize } from "sequelize";

export const sequelize = new Sequelize('chatdb', 'postgres', '1234', {
    host: 'localhost',
    dialect: 'postgres'
})

