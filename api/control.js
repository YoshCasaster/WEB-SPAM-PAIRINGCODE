let isSpamming = false;

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { action } = req.body;
        if (action === 'stop') {
            isSpamming = false;
            res.status(200).json({ message: 'Spamming stopped' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
