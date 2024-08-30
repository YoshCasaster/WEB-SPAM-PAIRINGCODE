const passwordForm = document.getElementById('passwordForm');
const phoneNumberForm = document.getElementById('phoneNumberForm');
const passwordInput = document.getElementById('password');
const submitPasswordButton = document.getElementById('submitPassword');
const passwordNotification = document.getElementById('passwordNotification');
const phoneNumberFormElement = document.getElementById('form');
const stopButton = document.getElementById('stopButton');
const responseMessage = document.getElementById('responseMessage');
const stopNotification = document.getElementById('stopNotification');
const background = document.getElementById('background');

const images = [
    '/media/bg1.jpg',
    '/media/bg2.jpg',
    '/media/bg3.jpg',
    '/media/bg4.jpg'
];

let currentImageIndex = 0;
let socket;

function changeBackground() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    background.style.backgroundImage = `url(${images[currentImageIndex]})`;
}

setInterval(changeBackground, 30000); // Change background every 30 seconds

submitPasswordButton.addEventListener('click', function() {
    const password = passwordInput.value;
    if (password === 'yosepwdd') {
        passwordForm.style.display = 'none';
        phoneNumberForm.style.display = 'block';
        initializeSocket();
    } else {
        passwordNotification.textContent = 'Password salah. Coba lagi.';
    }
});

function initializeSocket() {
    socket = new WebSocket('ws://localhost:3000'); // Periksa URL WebSocket

    phoneNumberFormElement.addEventListener('submit', function(event) {
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
}
