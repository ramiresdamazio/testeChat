import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    reactions: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    replyToId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    timestamps: true
})