document.getElementById('spam-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const phoneNumber = document.getElementById('phoneNumber').value;
    const response = await fetch('/api/spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
    });
    const result = await response.json();
    document.getElementById('progress').textContent = result.message;
});

document.getElementById('stopButton').addEventListener('click', async () => {
    const response = await fetch('/api/spam/stop', { method: 'POST' });
    const result = await response.json();
    document.getElementById('progress').textContent = result.message;
});
