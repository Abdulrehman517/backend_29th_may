import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

export const Venue = sequelize.define(
    'venues',
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        venue_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        time_zone: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        tableName: 'venues',
        timestamps: false,
    }
);

export const Event = sequelize.define(
    "events",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        venue_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        event_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        start_event_time: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        fee: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        added_by: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        notes: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        end_event_time: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        lead_by: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        tableName: "events",
        timestamps: false,
    }
);

export const EntryTeam = sequelize.define(
    'entry_teams',
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        entry_member_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        first_name: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        last_name: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        gender: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        instagram_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        create_time: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        update_time: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        lead_by: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        hourly_rate: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        tableName: 'entry_teams',
        timestamps: false,
    }
);
