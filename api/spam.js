let isSpamming = false;

async function startSpam(phoneNumber) {
    if (isSpamming) return;
    isSpamming = true;
    try {
        console.log(`Starting spam for ${phoneNumber}`);
        // Panggil fungsi spam seperti sebelumnya
        await startspam(phoneNumber);
    } catch (error) {
        console.error("Error during spamming:", error);
    } finally {
        isSpamming = false;
    }
}

async function stopSpam() {
    isSpamming = false;
    console.log("Spam stopped");
}

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { action, phoneNumber } = req.body;

        if (action === 'start') {
            await startSpam(phoneNumber);
            res.status(200).json({ message: 'Spam started' });
        } else if (action === 'stop') {
            stopSpam();
            res.status(200).json({ message: 'Spam stopped' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
    