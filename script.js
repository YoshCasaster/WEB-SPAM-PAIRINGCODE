document.getElementById('send-button').addEventListener('click', () => {
    const phoneNumber = document.getElementById('phone-number').value;
    if (!phoneNumber.match(/^62\d{7,}$/)) {
        alert('Format nomor HP tidak valid.');
        return;
    }

    fetch('/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('progress').innerText = 'Pengiriman dimulai: ' + data.message;
    })
    .catch(error => {
        document.getElementById('progress').innerText = 'Error: ' + error.message;
    });
});

document.getElementById('stop-button').addEventListener('click', () => {
    fetch('/stop', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            document.getElementById('progress').innerText = 'Pengiriman dihentikan.';
        })
        .catch(error => {
            document.getElementById('progress').innerText = 'Error: ' + error.message;
        });
});
