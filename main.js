const canvas = document.getElementById('textCanvas');
const ctx = canvas.getContext('2d');

// Автоматически выбираем размер шрифта: 13px для мобилок (экран < 768px) и 16px для десктопа
const fontSize = window.innerWidth < 768 ? 13 : 16;
const fontStyle = `400 ${fontSize}px 'Inter', sans-serif`;

const textContainer = document.querySelector('.about-text-container');

function resize() {
    if (textContainer) {
        canvas.width = textContainer.clientWidth;

        // На мобилках даем контейнеру чуть больше высоты, так как текст разобьется на большее количество строк
        if (window.innerWidth < 768) {
            textContainer.style.minHeight = '550px';
        } else {
            textContainer.style.minHeight = '450px';
        }

        canvas.height = textContainer.clientHeight;
    }
}

// Отслеживание изменения ориентации экрана и ресайза
window.addEventListener('resize', () => {
    resize();
    initText();
});

// Радиус взаимодействия (на мобилках делаем чуть меньше — 45px, чтобы палец не перекрывал весь эффект)
const mouse = { x: -1000, y: -1000, radius: window.innerWidth < 768 ? 45 : 30 };

if (textContainer) {
    // --- ДЛЯ ДЕСКТОПА (Мышь) ---
    textContainer.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    textContainer.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // --- ДЛЯ МОБИЛОК (Тач-скрин) ---
    textContainer.addEventListener('touchmove', (e) => {
        // Отключаем стандартный скролл страницы, только когда ведешь пальцем по тексту, чтобы он не дергался
        if (e.cancelable) e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
    }, { passive: false });

    textContainer.addEventListener('touchstart', (e) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
    });

    textContainer.addEventListener('touchend', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });
}

const paragraphs = [
    "Разработчик Python, интересно не просто писать код — а понимать, как он работает и почему именно так на системном уровне. Строю надёжные, асинхронные и консервативные решения.",
"Помимо бэкенд-разработки, я имею за плечами опыт работы в роли наставника по программированию и технического координатора в Технохабе в Душанбе. Я управлял процессами и администрировал проекты онлайн-обучения, а также вел буткемпы для детей и подростков на основе искусственного интеллекта. Помимо этого, успешно руководил курсом на основе веб-разработок на Python для взрослой аудитории.",
"Следующая цель — Rust. Максимальная надежность, скорость и безопасность памяти — именно то, что отделяет хорошее ПО от великого.",
"По типу кода: Unix-среда (Arch Linux), калистеника, чтение. Считаю, что ясная голова и системный подход — основные инструменты разработчика."
];

class Letter {
    constructor(char, x, y, fontSize) {
        this.char = char;
        this.x = x;
        this.y = y;
        this.origX = x;
        this.origY = y;
        this.fontSize = fontSize;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.85;
        this.ease = 0.08;
    }

    update() {
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            let force = (mouse.radius - distance) / mouse.radius;
            let angle = Math.atan2(dy, dx);

            this.vx += Math.cos(angle) * force * 16;
            this.vy += Math.sin(angle) * force * 16;
        }

        let dxOrig = this.origX - this.x;
        let dyOrig = this.origY - this.y;
        this.vx += dxOrig * this.ease;
        this.vy += dyOrig * this.ease;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        let dxOrig = this.x - this.origX;
        let dyOrig = this.y - this.origY;
        let shifted = Math.sqrt(dxOrig * dxOrig + dyOrig * dyOrig);

        if (shifted > 1) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        }

        ctx.fillText(this.char, this.x, this.y);
    }
}

const letters = [];

function initText() {
    letters.length = 0;
    ctx.font = fontStyle;

    let startY = 15;
    let startX = 0;
    let maxLineWidth = canvas.width;
    let currentX = startX;
    let currentY = startY;

    // Для мобилок уменьшаем межстрочный интервал, чтобы текст был компактнее
    const lineSpacing = window.innerWidth < 768 ? 1.5 : 1.7;
    const paragraphSpacing = window.innerWidth < 768 ? 2.4 : 3;

    paragraphs.forEach(p => {
        const words = p.split(' ');
        words.forEach(word => {
            const wordWidth = ctx.measureText(word + ' ').width;

            if (currentX + wordWidth > startX + maxLineWidth) {
                currentX = startX;
                currentY += fontSize * lineSpacing;
            }

            for (let i = 0; i < word.length; i++) {
                let charWidth = ctx.measureText(word[i]).width;
                letters.push(new Letter(word[i], currentX, currentY, fontSize));
                currentX += charWidth;
            }
            currentX += ctx.measureText(' ').width;
        });

        currentX = startX;
        currentY += fontSize * paragraphSpacing;
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontStyle;
    ctx.textBaseline = 'top';

    for (let i = 0; i < letters.length; i++) {
        letters[i].update();
        letters[i].draw();
    }

    requestAnimationFrame(animate);
}

resize();
initText();
animate();
