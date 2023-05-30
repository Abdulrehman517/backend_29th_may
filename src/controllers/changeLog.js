import ChangeLogs from '../models/changeLog.js';

class ChangeLogsController {
    constructor() {}

    static async getList(req, res, next) {
        try {

            const response  = await ChangeLogs.deletePastLogs();
            const changeLog = await ChangeLogs.getChangeLogs(req.params.type);
            if (!Array.isArray(changeLog) || !changeLog.length) {
                return res.status(404).json({ message: 'Change logs not found' });
            }

            const groupedChangelogs = changeLog.reduce((acc, curr) => {
                const { action_id, activity_id } = curr;

                const index = acc.findIndex((item) => item.action_id === action_id && item.activity_id === activity_id);

                if (index === -1) {
                    acc.push({
                        action_id,
                        activity_id,
                        items: [curr],
                    });

                    return acc;
                }

                acc[index].items.push(curr);

                return acc;
            }, []);
            return res.json({ data: groupedChangelogs });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default ChangeLogsController;
