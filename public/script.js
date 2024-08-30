const phoneNumberForm = document.getElementById('phoneNumberForm');
const stopButton = document.getElementById('stopButton');
const responseMessage = document.getElementById('responseMessage');
const stopNotification = document.getElementById('stopNotification');
const socket = new WebSocket('ws://web-spam-pairingcode.vercel.app'); // Periksa URL WebSocket

phoneNumberForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const phoneNumber = document.getElementById('phoneNumber').value;
    socket.send(JSON.stringify({ type: 'START', phoneNumber }));
});

stopButton.addEventListener('click', function() {
    socket.send(JSON.stringify({ type: 'STOP' }));
    stopNotification.textContent = 'Proses spam dihentikan.';
});

socket.onopen = function() {
    console.log('WebSocket connection opened');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'RESPONSE') {
        responseMessage.textContent = `Pairing code: ${data.code}`;
    } else if (data.type === 'ERROR') {
        responseMessage.textContent = 'Terjadi kesalahan. Coba lagi.';
    }
};

socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};
