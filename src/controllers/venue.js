import { Venue } from '../models/index.js';
import { Sequelize } from 'sequelize';

class VenuesController {
    constructor() {}

    static async list(req, res) {
        try {
            const venues = await Venue.findAll({
                attributes: ['id', 'venue_name', 'address', 'time_zone'],
            });
            if (!venues.length) {
                return res.json({ message: 'No Venues found' });
            }
            for (let i in venues) {
                venues[i].dataValues.row = parseInt(i) + 1;
            }
            return res.json({ data: venues });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { venue_name, address = null, time_zone = null } = req.body;

            if (!venue_name || venue_name.trim() == '') {
                return res.status(400).json({ message: 'Venue Name is required' });
            }

            let existing = await Venue.findOne({
                where: {
                    venue_name: venue_name.trim(),
                },
            });

            if (existing) {
                return res.status(400).json({ message: 'Venue with same name already exists' });
            }
            await Venue.create({
                venue_name: venue_name,
                address: address,
                time_zone: time_zone,
            });
            return res.json({ message: 'success' });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateById(req, res) {
        try {
            const { id, venue_name, address = null, time_zone = null } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'ID is required' });
            }

            let existing = await Venue.findOne({
                where: {
                    venue_name: venue_name.trim(),
                    id: {
                        [Sequelize.Op.not]: id,
                    },
                },
            });

            if (existing) {
                return res.status(400).json({ message: 'Venue with same name already exists' });
            }

            await Venue.update({ venue_name: venue_name, address: address, time_zone: time_zone }, { where: { id: id } });
            return res.json({ message: 'success' });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async deleteById(req, res) {
        try {
            await Venue.destroy({ where: { id: req.params.id } });
            return res.json({ message: 'Venue deleted successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const venue = await Venue.findOne({ where: { id: req.params.id } });
            if (!venue) {
                return res.status(404).json({ message: 'No Venue found' });
            }
            return res.json({ data: venue });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }
}

export default VenuesController;
