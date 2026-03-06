let currentStep = 1;
let apps = [];
let installedApps = new Set();
let activeWindows = new Set();
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let currentAppCalendarMonth = new Date().getMonth();
let currentAppCalendarYear = new Date().getFullYear();
let developerMode = false;
let ssapFiles = {};
let selectedVersion = 'home'; // Soiav 2 по умолчанию
let desktopIconSize = 'medium'; // small, medium, large
let taskbarPosition = 'bottom'; // bottom, top, left, right

document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    loadApps();
    createLiveTiles();
    updateTime();
    setInterval(updateTime, 1000);
    initializeSetupHandlers();
    initializeCalendar();
    initializeAppCalendar();
    initializeSettings();
    initializeSSAPFiles();
    
    // Закрытие контекстного меню при клике вне
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.context-menu')) {
            document.getElementById('contextMenu').classList.remove('active');
        }
    });
});

function initializeSSAPFiles() {
    ssapFiles = {
        'game.ssap': {
            name: 'Космическая игра',
            type: 'game',
            code: `APP: SpaceGame
VERSION: 1.0
TYPE: GAME

SCENE main
  BACKGROUND: space_bg
  PLAYER: spaceship
  ENEMIES: 5
  POWERUPS: 3
  
FUNCTION start_game()
  INIT player_position = [50, 50]
  INIT score = 0
  START game_loop()
END

FUNCTION game_loop()
  WHILE player_alive
    UPDATE player_position
    SPAWN enemies
    CHECK collisions
    RENDER frame
  END
  SHOW game_over
END`,
            description: 'Простая космическая аркада'
        },
        'app.ssap': {
            name: 'Калькулятор',
            type: 'app',
            code: `APP: Calculator
VERSION: 1.0
TYPE: APPLICATION

INTERFACE main
  WINDOW: [400, 500]
  TITLE: "Калькулятор"
  
  COMPONENTS:
    DISPLAY: result_display
    BUTTONS: number_buttons[0-9]
    OPERATORS: [plus, minus, multiply, divide]
    EQUALS: equals_btn
    CLEAR: clear_btn

FUNCTION calculate(expression)
  PARSE expression
  EVALUATE math
  RETURN result
END

FUNCTION button_click(value)
  UPDATE display
  IF equals_clicked
    CALL calculate()
  END
END`,
            description: 'Простой калькулятор'
        },
        'code.ssap': {
            name: 'Текстовый редактор',
            type: 'app',
            code: `APP: TextEditor
VERSION: 1.0
TYPE: APPLICATION

INTERFACE editor
  WINDOW: [800, 600]
  TITLE: "Текстовый редактор"
  MENU: [file, edit, view, help]
  
  COMPONENTS:
    TEXTAREA: main_editor
    TOOLBAR: formatting_tools
    STATUS_BAR: document_info

FUNCTION open_file(path)
  READ file_content
  LOAD_TO_EDITOR content
  UPDATE status_bar
END

FUNCTION save_file()
  GET editor_content
  WRITE_TO_FILE content
  SHOW success_message
END

FUNCTION format_text(style)
  APPLY style
  UPDATE preview
END`,
            description: 'Текстовый редактор с подсветкой синтаксиса'
        },
        'example.ssap': {
            name: 'Пример программы',
            type: 'demo',
            code: `APP: HelloWorld
VERSION: 1.0
TYPE: DEMO

FUNCTION main()
  PRINT "Добро пожаловать в Soiav 2!"
  PRINT "Это пример .ssap файла"
  PRINT "Система успешно загружена"
  
  CREATE window "Пример"
  ADD button "Нажми меня" WITH action show_message
  ADD label "Статус: Готов"
END

FUNCTION show_message()
  DISPLAY "Программа работает корректно!"
  LOG "Кнопка нажата"
END`,
            description: 'Демонстрационный файл'
        }
    };
}

// ================== SSAP ФУНКЦИИ ==================
function openSSAPFile(filename) {
    const ssapFile = ssapFiles[filename];
    if (!ssapFile) {
        showNotification('Ошибка', `Файл ${filename} не найден`);
        return;
    }

    if (ssapFile.type === 'game') {
        runSSAPGame(ssapFile);
    } else {
        openSSAPRunner(ssapFile);
    }
}

function openSSAPRunner(ssapFile) {
    const runner = document.getElementById('ssapRunner');
    const content = document.getElementById('ssapRunnerContent');
    
    let runnerContent = '';
    
    switch(ssapFile.type) {
        case 'app':
            runnerContent = `
                <div class="ssap-app-window">
                    <div class="ssap-app-title">${ssapFile.name}</div>
                    <div class="ssap-app-content">
                        <p>${ssapFile.description}</p>
                        <div style="margin: 20px 0;">
                            <button class="game-btn" onclick="startSSAPApp('${ssapFile.name}')">
                                <i class="fas fa-play"></i> Запустить приложение
                            </button>
                            <button class="game-btn" onclick="showSSAPCode('${ssapFile.name}')">
                                <i class="fas fa-code"></i> Показать код
                            </button>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'demo':
            runnerContent = `
                <div class="ssap-app-window">
                    <div class="ssap-app-title">${ssapFile.name}</div>
                    <div class="ssap-app-content">
                        <p>${ssapFile.description}</p>
                        <div style="background: var(--background-secondary); padding: 20px; border-radius: 8px; margin: 15px 0;">
                            <pre style="font-family: 'Courier New', monospace; font-size: 12px; color: var(--text-primary);">${ssapFile.code}</pre>
                        </div>
                        <button class="game-btn" onclick="executeSSAPDemo('${ssapFile.name}')">
                            <i class="fas fa-play"></i> Выполнить демо
                        </button>
                    </div>
                </div>
            `;
            break;
    }
    
    content.innerHTML = runnerContent;
    runner.querySelector('.window-header span').innerHTML = `<i class="fas fa-play"></i> ${ssapFile.name}`;
    openApp('ssapRunner');
}

function runSSAPGame(ssapFile) {
    const runner = document.getElementById('ssapRunner');
    const content = document.getElementById('ssapRunnerContent');
    
    const gameContent = `
        <div class="game-container">
            <div class="game-title">${ssapFile.name}</div>
            <div class="game-controls">
                <button class="game-btn" onclick="startGame()">
                    <i class="fas fa-play"></i> Начать игру
                </button>
                <button class="game-btn" onclick="showInstructions()">
                    <i class="fas fa-info-circle"></i> Инструкции
                </button>
                <button class="game-btn" onclick="showSSAPCode('${ssapFile.name}')">
                    <i class="fas fa-code"></i> Исходный код
                </button>
            </div>
            <canvas id="gameCanvas" width="600" height="400" class="game-canvas"></canvas>
            <div id="gameInfo" style="margin-top: 15px; font-size: 14px; color: var(--text-secondary);">
                Очки: <span id="score">0</span> | Жизни: <span id="lives">3</span>
            </div>
        </div>
    `;
    
    content.innerHTML = gameContent;
    runner.querySelector('.window-header span').innerHTML = `<i class="fas fa-gamepad"></i> ${ssapFile.name}`;
    openApp('ssapRunner');
}

function startSSAPApp(appName) {
    showNotification('Запуск приложения', `Приложение "${appName}" запускается...`);
    setTimeout(() => {
        showNotification('Приложение', `"${appName}" успешно запущено`);
    }, 1500);
}

function executeSSAPDemo(demoName) {
    showNotification('Демонстрация', `Выполняется демо: ${demoName}`);
    
    const messages = [
        "Инициализация системы...",
        "Загрузка модулей...", 
        "Проверка зависимостей...",
        "Запуск демонстрации...",
        "Демонстрация завершена успешно!"
    ];
    
    let currentMessage = 0;
    const interval = setInterval(() => {
        if (currentMessage < messages.length) {
            showNotification('Демо', messages[currentMessage]);
            currentMessage++;
        } else {
            clearInterval(interval);
        }
    }, 1000);
}

function showSSAPCode(filename) {
    const ssapFile = ssapFiles[filename];
    if (ssapFile) {
        const fileViewer = document.getElementById('fileViewer');
        const content = document.getElementById('fileViewerContent');
        
        content.innerHTML = `
            <div class="file-content">
                <h3>${ssapFile.name} - Исходный код</h3>
                <p>Тип: ${ssapFile.type} | Описание: ${ssapFile.description}</p>
                <div style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; margin: 15px 0; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; overflow-x: auto;">
                    <pre>${ssapFile.code}</pre>
                </div>
                <button class="setting-btn" onclick="openSSAPCompilerWithCode('${filename}')">
                    <i class="fas fa-edit"></i> Редактировать в компиляторе
                </button>
            </div>
        `;
        
        fileViewer.querySelector('.window-header span').innerHTML = `<i class="fas fa-code"></i> ${filename}`;
        openApp('fileViewer');
    }
}

function openSSAPCompiler() {
    openApp('ssapCompiler');
}

function openSSAPCompilerWithCode(filename) {
    const ssapFile = ssapFiles[filename];
    if (ssapFile) {
        document.getElementById('ssapCodeEditor').value = ssapFile.code;
        openApp('ssapCompiler');
    }
}

function loadSSAPFile() {
    const filename = Object.keys(ssapFiles)[0];
    const ssapFile = ssapFiles[filename];
    if (ssapFile) {
        document.getElementById('ssapCodeEditor').value = ssapFile.code;
        showNotification('Компилятор', `Загружен файл: ${filename}`);
    }
}

function compileSSAP() {
    const code = document.getElementById('ssapCodeEditor').value;
    const output = document.getElementById('compilerOutput');
    
    output.innerHTML = '';
    
    const steps = [
        "Парсинг SSAP кода...",
        "Проверка синтаксиса...",
        "Оптимизация байт-кода...",
        "Генерация исполняемого файла...",
        "Компиляция завершена успешно!"
    ];
    
    let currentStep = 0;
    
    function nextStep() {
        if (currentStep < steps.length) {
            const line = document.createElement('div');
            line.textContent = `> ${steps[currentStep]}`;
            output.appendChild(line);
            currentStep++;
            output.scrollTop = output.scrollHeight;
            setTimeout(nextStep, 800);
        } else {
            const successLine = document.createElement('div');
            successLine.innerHTML = `<span style="color: #4CAF50;">> Готово! Приложение скомпилировано.</span>`;
            output.appendChild(successLine);
            output.scrollTop = output.scrollHeight;
            
            showNotification('Компилятор', 'SSAP код успешно скомпилирован');
        }
    }
    
    nextStep();
}

function saveSSAPFile() {
    const code = document.getElementById('ssapCodeEditor').value;
    showNotification('Компилятор', 'Файл сохранен успешно');
}

// ================== ФУНКЦИИ УСТАНОВКИ ==================
function initializeSetupHandlers() {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            const theme = this.dataset.theme;
            document.documentElement.setAttribute('data-theme', theme);
        });
    });

    document.querySelectorAll('.wallpaper-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.wallpaper-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function initializeSystem() {
    const savedTheme = localStorage.getItem('soiav-theme');
    const savedWallpaper = localStorage.getItem('soiav-wallpaper');
    const savedUsername = localStorage.getItem('soiav-username');
    const savedAccentColor = localStorage.getItem('soiav-accent-color');
    const savedVersion = localStorage.getItem('soiav-version');
    const savedIconSize = localStorage.getItem('soiav-icon-size');
    const savedTaskbarPos = localStorage.getItem('soiav-taskbar-position');

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeSelector(savedTheme);
    }
    
    if (savedWallpaper) {
        setWallpaper(savedWallpaper);
    }
    
    if (savedUsername) {
        document.getElementById('username').value = savedUsername;
        updateUserInfo(savedUsername);
    }
    
    if (savedAccentColor) {
        document.documentElement.style.setProperty('--accent-color', savedAccentColor);
        document.getElementById('accentColor').value = savedAccentColor;
        if (document.getElementById('accentColorSetting')) {
            document.getElementById('accentColorSetting').value = savedAccentColor;
        }
    }
    
    if (savedVersion) {
        selectedVersion = savedVersion;
    }
    
    if (savedIconSize) {
        desktopIconSize = savedIconSize;
        applyDesktopIconSize(savedIconSize);
    }
    
    if (savedTaskbarPos) {
        taskbarPosition = savedTaskbarPos;
        applyTaskbarPosition(savedTaskbarPos);
    }

    if (localStorage.getItem('soiav-setup-completed')) {
        completeSetup();
    }
}

function nextStep(step) {
    if (step === 6) {
        startFinalSetup();
        return;
    }
    
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
}

function prevStep(step) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
}

function selectVersion(version) {
    selectedVersion = version;
    document.querySelectorAll('.version-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    const versionNames = {
        'home': 'Soiav 2',
        'work': 'Soiav 2 работа',
        'pro': 'Soiav 2 Pro',
        'server': 'Soiav 2 Server β'
    };
    showNotification('Выбрана версия', versionNames[version]);
}

function startFinalSetup() {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById('step6').classList.add('active');
    currentStep = 6;

    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const steps = [
        {text: 'Подготовка системы...', duration: 1000},
        {text: 'Настройка тем...', duration: 1500},
        {text: 'Применение обоев...', duration: 1200},
        {text: 'Активация версии...', duration: 1000},
        {text: 'Конфигурация системы...', duration: 1800},
        {text: 'Оптимизация...', duration: 2000},
        {text: 'Завершение...', duration: 1500}
    ];

    let totalTime = 0;
    steps.forEach(step => totalTime += step.duration);

    let currentProgress = 0;
    let currentStepIndex = 0;

    function updateProgress() {
        if (currentStepIndex < steps.length) {
            const step = steps[currentStepIndex];
            progressText.textContent = step.text;
            
            setTimeout(() => {
                currentProgress += (step.duration / totalTime) * 100;
                progressFill.style.width = currentProgress + '%';
                currentStepIndex++;
                updateProgress();
            }, step.duration);
        } else {
            setTimeout(() => {
                completeSetup();
            }, 1000);
        }
    }

    updateProgress();
}

function completeSetup() {
    const theme = document.querySelector('.theme-option.active')?.dataset.theme || 'light';
    const wallpaper = document.querySelector('.wallpaper-option.active')?.dataset.wallpaper || '1';
    const username = document.getElementById('username').value || 'Пользователь Soiav';
    const accentColor = document.getElementById('accentColor').value;
    const systemDisk = document.getElementById('systemDisk')?.value || 'C';
    const performance = document.getElementById('performance')?.value || 'balanced';
    const timezone = document.getElementById('timezone')?.value || 'moscow';
    const version = selectedVersion;

    localStorage.setItem('soiav-theme', theme);
    localStorage.setItem('soiav-wallpaper', wallpaper);
    localStorage.setItem('soiav-username', username);
    localStorage.setItem('soiav-accent-color', accentColor);
    localStorage.setItem('soiav-system-disk', systemDisk);
    localStorage.setItem('soiav-performance', performance);
    localStorage.setItem('soiav-timezone', timezone);
    localStorage.setItem('soiav-version', version);
    localStorage.setItem('soiav-icon-size', desktopIconSize);
    localStorage.setItem('soiav-taskbar-position', taskbarPosition);
    localStorage.setItem('soiav-setup-completed', 'true');

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent-color', accentColor);
    setWallpaper(wallpaper);
    updateUserInfo(username);

    document.querySelector('.setup-wizard').classList.remove('active');
    document.querySelector('.desktop').classList.add('active');

    const versionNames = {
        'home': 'Soiav 2',
        'work': 'Soiav 2 работа',
        'pro': 'Soiav 2 Pro',
        'server': 'Soiav 2 Server β'
    };

    setTimeout(() => {
        showNotification('Добро пожаловать!', `${versionNames[version]} · Добро пожаловать, ${username}!`);
    }, 1000);
}

function setWallpaper(wallpaperId) {
    const wallpapers = {
        '1': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        '2': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        '3': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b',
        '4': 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07'
    };
    
    if (wallpapers[wallpaperId]) {
        document.querySelector('.desktop').style.backgroundImage = `url('${wallpapers[wallpaperId]}')`;
    }
}

function updateUserInfo(username) {
    const nameElement = document.getElementById('userName');
    const nameStartElement = document.getElementById('userNameStart');
    const accountNameElement = document.getElementById('accountUserName');
    
    if (nameElement) nameElement.textContent = username;
    if (nameStartElement) nameStartElement.textContent = username;
    if (accountNameElement) accountNameElement.textContent = username;
    
    const initials = username.split(' ').map(n => n[0]).join('').toUpperCase() || 'ПС';
    
    const smallAvatar = document.querySelector('.user-avatar-small');
    const largeAvatar = document.querySelector('.user-avatar-large');
    const avatar = document.querySelector('.user-avatar');
    
    if (smallAvatar) smallAvatar.textContent = initials;
    if (largeAvatar) largeAvatar.textContent = initials;
    if (avatar) avatar.textContent = initials;
}

function updateThemeSelector(theme) {
    document.querySelectorAll('.theme-option').forEach(opt => {
        if (opt.dataset.theme === theme) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

// ================== ФУНКЦИИ РАБОЧЕГО СТОЛА И ОКОН ==================
function openApp(appId) {
    const window = document.getElementById(appId);
    if (window) {
        window.classList.add('active');
        activeWindows.add(appId);
        updateTaskbar(appId, true);
        
        if (!document.querySelector(`.taskbar-app[data-app="${appId}"]`)) {
            const appElement = document.querySelector(`[data-app="${appId}"]`);
            if (appElement) {
                const icon = appElement.querySelector('i').className;
                addToTaskbar(appId, icon);
            }
        }
        
        window.style.animation = 'windowSlideIn 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
        setTimeout(() => {
            window.style.animation = '';
        }, 300);
    }
}

function closeWindow(appId) {
    const window = document.getElementById(appId);
    if (window) {
        window.classList.remove('active');
        activeWindows.delete(appId);
        updateTaskbar(appId, false);
        
        window.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            window.style.animation = '';
        }, 200);
    }
}

function minimizeWindow(appId) {
    const window = document.getElementById(appId);
    if (window) {
        window.classList.remove('active');
        updateTaskbar(appId, false);
        
        window.style.transform = 'scale(0.8)';
        window.style.opacity = '0';
        setTimeout(() => {
            window.style.transform = '';
            window.style.opacity = '';
        }, 300);
    }
}

function maximizeWindow(appId) {
    const window = document.getElementById(appId);
    if (window) {
        if (window.classList.contains('maximized')) {
            window.classList.remove('maximized');
            window.style.width = '';
            window.style.height = '';
            window.style.top = '';
            window.style.left = '';
        } else {
            window.classList.add('maximized');
            window.style.width = '95vw';
            window.style.height = '90vh';
            window.style.top = '2.5vh';
            window.style.left = '2.5vw';
        }
    }
}

function toggleApp(appId) {
    const window = document.getElementById(appId);
    if (window && window.classList.contains('active')) {
        minimizeWindow(appId);
    } else {
        openApp(appId);
    }
}

function updateTaskbar(appId, isActive) {
    const taskbarApp = document.querySelector(`.taskbar-app[data-app="${appId}"]`);
    if (taskbarApp) {
        if (isActive) {
            taskbarApp.classList.add('active');
        } else {
            taskbarApp.classList.remove('active');
        }
    }
}

function addToTaskbar(appId, iconClass) {
    const taskbarApps = document.getElementById('taskbarApps');
    const appElement = document.createElement('div');
    appElement.className = 'taskbar-app';
    appElement.setAttribute('data-app', appId);
    appElement.innerHTML = `<i class="${iconClass}"></i>`;
    appElement.onclick = () => toggleApp(appId);
    taskbarApps.appendChild(appElement);
}

// ================== МЕНЮ ПУСК ==================
function toggleStartMenu() {
    const startMenu = document.getElementById('startMenu');
    startMenu.classList.toggle('active');
    
    if (startMenu.classList.contains('active')) {
        startMenu.style.animation = 'startMenuSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
}

function toggleSideMenu() {
    const sideMenu = document.getElementById('sideMenu');
    sideMenu.classList.toggle('active');
}

function toggleNotificationCenter() {
    const notificationCenter = document.getElementById('notificationCenter');
    notificationCenter.classList.toggle('active');
}

function toggleAccountMenu() {
    const accountMenu = document.getElementById('accountMenu');
    accountMenu.classList.toggle('active');
}

function toggleCalendar() {
    const calendarPopup = document.getElementById('calendarPopup');
    calendarPopup.classList.toggle('active');
    updateCalendar();
}

// ================== КОНТЕКСТНОЕ МЕНЮ (ПКМ) ==================
function showContextMenu(e) {
    e.preventDefault();
    const menu = document.getElementById('contextMenu');
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.classList.add('active');
}

function createNewFile() {
    showNotification('Создание', 'Создание нового файла...');
    document.getElementById('contextMenu').classList.remove('active');
}

function openPersonalization() {
    openApp('settings');
    setTimeout(() => {
        document.querySelector('[data-category="personalization"]').click();
    }, 300);
    document.getElementById('contextMenu').classList.remove('active');
}

function changeIconSize() {
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(desktopIconSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    desktopIconSize = sizes[nextIndex];
    
    applyDesktopIconSize(desktopIconSize);
    localStorage.setItem('soiav-icon-size', desktopIconSize);
    
    showNotification('Размер иконок', `Установлен размер: ${getSizeName(desktopIconSize)}`);
    document.getElementById('contextMenu').classList.remove('active');
}

function applyDesktopIconSize(size) {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.dataset.size = size;
    });
}

function getSizeName(size) {
    const names = {
        'small': 'Маленькие',
        'medium': 'Средние',
        'large': 'Большие'
    };
    return names[size];
}

function refreshDesktop() {
    showNotification('Обновление', 'Рабочий стол обновлен');
    document.getElementById('contextMenu').classList.remove('active');
}

function openDisplaySettings() {
    showNotification('Экран', 'Открытие параметров экрана...');
    document.getElementById('contextMenu').classList.remove('active');
}

// ================== НАСТРОЙКИ ==================
function initializeSettings() {
    document.querySelectorAll('.settings-category').forEach(category => {
        category.addEventListener('click', function() {
            const categoryId = this.dataset.category;
            
            document.querySelectorAll('.settings-category').forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.settings-section').forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(categoryId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('soiav-theme', theme);
    updateThemeSelector(theme);
}

function changeAccentColor(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('soiav-accent-color', color);
}

function changeDesktopIconSize(size) {
    desktopIconSize = size;
    applyDesktopIconSize(size);
    localStorage.setItem('soiav-icon-size', size);
    showNotification('Иконки', `Размер изменен на ${getSizeName(size)}`);
}

function changeTaskbarPosition(position) {
    taskbarPosition = position;
    applyTaskbarPosition(position);
    localStorage.setItem('soiav-taskbar-position', position);
    showNotification('Панель задач', `Положение изменено на ${position}`);
}

function applyTaskbarPosition(position) {
    const taskbar = document.getElementById('taskbar');
    taskbar.dataset.position = position;
    
    const startMenu = document.getElementById('startMenu');
    if (position === 'top') {
        startMenu.style.bottom = 'auto';
        startMenu.style.top = '58px';
    } else if (position === 'bottom') {
        startMenu.style.bottom = '58px';
        startMenu.style.top = 'auto';
    } else if (position === 'left') {
        startMenu.style.bottom = '58px';
        startMenu.style.left = '58px';
    } else if (position === 'right') {
        startMenu.style.bottom = '58px';
        startMenu.style.right = '58px';
        startMenu.style.left = 'auto';
    }
}

function changeComputerName() {
    const newName = prompt('Введите новое имя компьютера:', 'SOIAV-DESKTOP');
    if (newName) {
        showNotification('Система', `Имя компьютера изменено на ${newName}`);
    }
}

function changePerformanceMode(mode) {
    const modes = {
        'balanced': 'Сбалансированный',
        'performance': 'Высокая производительность',
        'powersave': 'Энергосбережение'
    };
    showNotification('Производительность', `Режим: ${modes[mode]}`);
    localStorage.setItem('soiav-performance', mode);
}

function toggleAutoLogin() {
    showNotification('Автовход', 'Настройка автоматического входа...');
}

function selectSystemVersion(version) {
    selectedVersion = version;
    
    document.querySelectorAll('.version-card').forEach(card => {
        card.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    const versionNames = {
        'home': 'Soiav 2',
        'work': 'Soiav 2 работа',
        'pro': 'Soiav 2 Pro',
        'server': 'Soiav 2 Server β'
    };
    
    localStorage.setItem('soiav-version', version);
    showNotification('Версия системы', `Активирована: ${versionNames[version]}`);
}

function changeProductKey() {
    const key = prompt('Введите ключ продукта:', 'XXXXX-XXXXX-XXXXX-XXXXX');
    if (key && key.length > 0) {
        showNotification('Ключ продукта', 'Ключ успешно изменен');
    }
}

function checkForUpdates() {
    showNotification('Обновления', 'Проверка обновлений...');
    setTimeout(() => {
        showNotification('Обновления', 'Обновлений не найдено. Ваша система актуальна.');
    }, 2000);
}

function lockScreen() {
    showNotification('Система', 'Экран заблокирован');
    toggleAccountMenu();
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        showNotification('Система', 'Выход из системы...');
        setTimeout(() => {
            localStorage.removeItem('soiav-setup-completed');
            location.reload();
        }, 1000);
    }
}

// ================== БЫСТРЫЕ НАСТРОЙКИ ==================
function toggleWiFi() {
    const toggle = document.getElementById('wifiToggle');
    toggle.classList.toggle('active');
    showNotification('Wi-Fi', toggle.classList.contains('active') ? 'Включено' : 'Выключено');
}

function toggleBluetooth() {
    const toggle = document.getElementById('bluetoothToggle');
    toggle.classList.toggle('active');
    showNotification('Bluetooth', toggle.classList.contains('active') ? 'Включено' : 'Выключено');
}

function toggleAirplane() {
    const toggle = document.getElementById('airplaneToggle');
    toggle.classList.toggle('active');
    showNotification('Режим полета', toggle.classList.contains('active') ? 'Включено' : 'Выключено');
}

function toggleDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    toggle.classList.toggle('active');
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('soiav-theme', newTheme);
    updateThemeSelector(newTheme);
    
    showNotification('Темный режим', newTheme === 'dark' ? 'Включен' : 'Выключен');
}

// ================== УСТРОЙСТВА ==================
function manageBluetooth() {
    showNotification('Bluetooth', 'Открытие менеджера Bluetooth устройств...');
    
    const devices = [
        { name: 'Наушники Sony', type: 'audio', status: 'connected' },
        { name: 'Мышь Logitech', type: 'mouse', status: 'connected' },
        { name: 'Клавиатура Microsoft', type: 'keyboard', status: 'available' },
        { name: 'Телефон Samsung', type: 'phone', status: 'offline' }
    ];
    
    setTimeout(() => {
        showDeviceManager('Bluetooth устройства', devices);
    }, 1000);
}

function managePrinters() {
    showNotification('Принтеры', 'Открытие менеджера принтеров...');
    
    const printers = [
        { name: 'HP LaserJet Pro', type: 'printer', status: 'online' },
        { name: 'Canon PIXMA', type: 'printer', status: 'offline' },
        { name: 'Epson Workforce', type: 'printer', status: 'online' }
    ];
    
    setTimeout(() => {
        showDeviceManager('Принтеры и сканеры', printers);
    }, 1000);
}

function manageMouse() {
    showNotification('Мышь', 'Открытие настроек мыши...');
}

function manageKeyboard() {
    showNotification('Клавиатура', 'Открытие настроек клавиатуры...');
}

function manageSound() {
    showNotification('Звук', 'Открытие настроек звука...');
}

function showDeviceManager(title, devices) {
    const fileViewer = document.getElementById('fileViewer');
    const content = document.getElementById('fileViewerContent');
    
    let devicesHTML = '';
    devices.forEach(device => {
        const statusClass = device.status === 'connected' || device.status === 'online' ? '' : 
                           device.status === 'available' ? 'connecting' : 'offline';
        
        devicesHTML += `
            <div class="device-item">
                <div class="device-info">
                    <div class="device-icon">
                        <i class="fas fa-${getDeviceIcon(device.type)}"></i>
                    </div>
                    <div class="device-details">
                        <h4>${device.name}</h4>
                        <p>${getDeviceTypeName(device.type)}</p>
                    </div>
                </div>
                <div class="device-status">
                    <div class="status-indicator ${statusClass}"></div>
                    <span>${getStatusText(device.status)}</span>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = `
        <div class="file-content">
            <h3>${title}</h3>
            <div class="device-list">
                ${devicesHTML}
            </div>
            <div style="margin-top: 20px;">
                <button class="setting-btn" onclick="scanForDevices()">
                    <i class="fas fa-sync-alt"></i> Обновить список
                </button>
                <button class="setting-btn" onclick="addNewDevice()">
                    <i class="fas fa-plus"></i> Добавить устройство
                </button>
            </div>
        </div>
    `;
    
    fileViewer.querySelector('.window-header span').innerHTML = `<i class="fas fa-plug"></i> ${title}`;
    openApp('fileViewer');
}

function getDeviceIcon(type) {
    const icons = {
        'audio': 'headphones',
        'mouse': 'mouse',
        'keyboard': 'keyboard',
        'phone': 'mobile-alt',
        'printer': 'print'
    };
    return icons[type] || 'plug';
}

function getDeviceTypeName(type) {
    const names = {
        'audio': 'Аудио устройство',
        'mouse': 'Мышь',
        'keyboard': 'Клавиатура',
        'phone': 'Телефон',
        'printer': 'Принтер'
    };
    return names[type] || 'Устройство';
}

function getStatusText(status) {
    const texts = {
        'connected': 'Подключено',
        'available': 'Доступно',
        'offline': 'Не в сети',
        'online': 'В сети'
    };
    return texts[status] || status;
}

function scanForDevices() {
    showNotification('Поиск', 'Сканирование устройств...');
    setTimeout(() => {
        showNotification('Поиск', 'Новые устройства не найдены');
    }, 2000);
}

function addNewDevice() {
    showNotification('Добавление', 'Открытие мастера добавления устройств...');
}

// ================== УВЕДОМЛЕНИЯ ==================
function showNotification(title, text) {
    console.log(`Уведомление: ${title} - ${text}`);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--background-secondary);
        color: var(--text-primary);
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-left: 4px solid var(--accent-color);
        z-index: 10000;
        max-width: 280px;
        animation: slideInRight 0.3s ease;
    `;
    notification.innerHTML = `
        <strong>${title}</strong><br>
        <span style="font-size: 11px; color: var(--text-secondary);">${text}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ================== ВРЕМЯ И КАЛЕНДАРЬ ==================
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const currentTime = document.getElementById('currentTime');
    const currentDate = document.getElementById('currentDate');
    
    if (currentTime) currentTime.textContent = timeString;
    if (currentDate) currentDate.textContent = dateString;
}

function initializeCalendar() {
    updateCalendar();
}

function updateCalendar() {
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarDays = document.getElementById('calendarDays');
    
    if (!calendarMonth || !calendarDays) return;
    
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    calendarMonth.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const today = new Date();
    
    let daysHtml = '';
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    for (let i = 0; i < startingDay; i++) {
        const prevMonthDay = new Date(currentCalendarYear, currentCalendarMonth, -i);
        daysHtml += `<div class="calendar-day-popup other-month">${prevMonthDay.getDate()}</div>`;
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === today.getDate() && 
                       currentCalendarMonth === today.getMonth() && 
                       currentCalendarYear === today.getFullYear();
        const dayClass = isToday ? 'calendar-day-popup current' : 'calendar-day-popup';
        daysHtml += `<div class="${dayClass}">${day}</div>`;
    }
    
    const totalCells = 42;
    const remainingCells = totalCells - (startingDay + lastDay.getDate());
    
    for (let i = 1; i <= remainingCells; i++) {
        daysHtml += `<div class="calendar-day-popup other-month">${i}</div>`;
    }
    
    calendarDays.innerHTML = daysHtml;
}

function changeCalendarMonth(direction) {
    currentCalendarMonth += direction;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    updateCalendar();
}

function initializeAppCalendar() {
    updateAppCalendar();
}

function updateAppCalendar() {
    const appCalendarMonth = document.getElementById('appCalendarMonth');
    const appCalendarDays = document.getElementById('appCalendarDays');
    
    if (!appCalendarMonth || !appCalendarDays) return;
    
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    appCalendarMonth.textContent = `${monthNames[currentAppCalendarMonth]} ${currentAppCalendarYear}`;
    
    const firstDay = new Date(currentAppCalendarYear, currentAppCalendarMonth, 1);
    const lastDay = new Date(currentAppCalendarYear, currentAppCalendarMonth + 1, 0);
    const today = new Date();
    
    let daysHtml = '';
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    for (let i = 0; i < startingDay; i++) {
        const prevMonthDay = new Date(currentAppCalendarYear, currentAppCalendarMonth, -i);
        daysHtml += `<div class="calendar-day other-month">${prevMonthDay.getDate()}</div>`;
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === today.getDate() && 
                       currentAppCalendarMonth === today.getMonth() && 
                       currentAppCalendarYear === today.getFullYear();
        const dayClass = isToday ? 'calendar-day current' : 'calendar-day';
        daysHtml += `<div class="${dayClass}">${day}</div>`;
    }
    
    const totalCells = 42;
    const remainingCells = totalCells - (startingDay + lastDay.getDate());
    
    for (let i = 1; i <= remainingCells; i++) {
        daysHtml += `<div class="calendar-day other-month">${i}</div>`;
    }
    
    appCalendarDays.innerHTML = daysHtml;
}

function changeAppCalendarMonth(direction) {
    currentAppCalendarMonth += direction;
    if (currentAppCalendarMonth < 0) {
        currentAppCalendarMonth = 11;
        currentAppCalendarYear--;
    } else if (currentAppCalendarMonth > 11) {
        currentAppCalendarMonth = 0;
        currentAppCalendarYear++;
    }
    updateAppCalendar();
}

// ================== ПРИЛОЖЕНИЯ И МАГАЗИН ==================
function loadApps() {
    apps = [
        {
            id: 'calculator',
            title: 'Калькулятор',
            description: 'Простой и удобный калькулятор',
            icon: 'fas fa-calculator',
            category: 'utilities',
            size: '2.3 MB',
            rating: 4.5,
            installed: false,
            isNew: true
        },
        {
            id: 'snake',
            title: 'Змейка',
            description: 'Классическая игра змейка',
            icon: 'fas fa-gamepad',
            category: 'games',
            size: '1.8 MB',
            rating: 4.8,
            installed: false,
            isNew: true
        },
        {
            id: 'tetris',
            title: 'Тетрис',
            description: 'Классический тетрис',
            icon: 'fas fa-th-large',
            category: 'games',
            size: '2.1 MB',
            rating: 4.9,
            installed: false,
            isNew: false
        },
        {
            id: 'minesweeper',
            title: 'Сапер',
            description: 'Классический сапер',
            icon: 'fas fa-flag',
            category: 'games',
            size: '1.5 MB',
            rating: 4.3,
            installed: false,
            isNew: false
        }
    ];
    
    renderApps();
}

function renderApps() {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid) return;
    
    appsGrid.innerHTML = '';
    
    apps.forEach(app => {
        const appCard = document.createElement('div');
        appCard.className = 'app-card';
        appCard.innerHTML = `
            ${app.isNew ? '<div class="new-badge">Новый</div>' : ''}
            <div class="app-icon">
                <i class="${app.icon}"></i>
            </div>
            <div class="app-title">${app.title}</div>
            <div class="app-desc">${app.description}</div>
            <div class="app-meta">
                <span>${app.size}</span>
                <span>★ ${app.rating}</span>
            </div>
            <button class="install-btn ${app.installed ? 'installed' : ''}" 
                    onclick="installApp('${app.id}')">
                ${app.installed ? 'Установлено' : 'Установить'}
            </button>
        `;
        appsGrid.appendChild(appCard);
    });
}

function installApp(appId) {
    const app = apps.find(a => a.id === appId);
    if (app && !app.installed) {
        app.installed = true;
        installedApps.add(appId);
        renderApps();
        
        createDesktopIcon(app);
        
        showNotification('Установка', `Приложение "${app.title}" успешно установлено!`);
    }
}

function createDesktopIcon(app) {
    const desktopIcons = document.querySelector('.desktop-icons');
    if (!desktopIcons) return;
    
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.setAttribute('data-app', app.id);
    icon.innerHTML = `
        <i class="${app.icon}"></i>
        <span>${app.title}</span>
    `;
    icon.onclick = () => openApp(app.id);
    desktopIcons.appendChild(icon);
}

function createLiveTiles() {
    const tilesRow = document.querySelector('.tiles-row');
    if (!tilesRow) return;
    
    const tiles = [
        { icon: 'fas fa-folder', title: 'Проводник', color: '#0078d7', size: 'small' },
        { icon: 'fas fa-globe', title: 'Браузер', color: '#107c10', size: 'small' },
        { icon: 'fas fa-shopping-bag', title: 'Магазин', color: '#e81123', size: 'wide' },
        { icon: 'fas fa-cog', title: 'Настройки', color: '#744da9', size: 'small' },
        { icon: 'fas fa-images', title: 'Фотографии', color: '#008272', size: 'medium' },
        { icon: 'fas fa-music', title: 'Музыка', color: '#bf0077', size: 'medium' },
        { icon: 'fas fa-calendar-alt', title: 'Календарь', color: '#004b50', size: 'medium' },
        { icon: 'fas fa-gamepad', title: 'Игры', color: '#f7630c', size: 'large' }
    ];
    
    tiles.forEach(tile => {
        const tileElement = document.createElement('div');
        tileElement.className = `live-tile ${tile.size}`;
        tileElement.style.background = `linear-gradient(135deg, ${tile.color}, ${lightenColor(tile.color, 20)})`;
        tileElement.innerHTML = `
            <div class="tile-content">
                <i class="tile-icon ${tile.icon}"></i>
                <div class="tile-title">${tile.title}</div>
            </div>
        `;
        tileElement.onclick = () => {
            if (tile.title === 'Проводник') openApp('fileExplorer');
            else if (tile.title === 'Браузер') openApp('browser');
            else if (tile.title === 'Магазин') openApp('store');
            else if (tile.title === 'Настройки') openApp('settings');
            else if (tile.title === 'Фотографии') openApp('photos');
            else if (tile.title === 'Музыка') openApp('music');
            else if (tile.title === 'Календарь') openApp('calendar');
            else if (tile.title === 'Игры') openApp('store');
            toggleStartMenu();
        };
        tilesRow.appendChild(tileElement);
    });
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
}

// ================== ТЕРМИНАЛ ==================
function handleTerminalCommand(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('terminalInput');
        const command = input.value.trim();
        input.value = '';
        
        const output = document.getElementById('terminalOutput');
        if (!output) return;
        
        const newLine = document.createElement('div');
        newLine.className = 'terminal-line';
        newLine.innerHTML = `<span class="prompt">user@soiav:~$ </span><span class="command">${command}</span>`;
        output.appendChild(newLine);
        
        handleCommand(command, output);
        
        output.scrollTop = output.scrollHeight;
    }
}

function handleCommand(command, output) {
    const response = document.createElement('div');
    
    switch (command.toLowerCase()) {
        case 'help':
            response.innerHTML = `
                Доступные команды:<br>
                - help: показать эту справку<br>
                - neofetch: информация о системе<br>
                - date: текущая дата и время<br>
                - clear: очистить терминал<br>
                - echo [текст]: повторить текст<br>
                - apps: список установленных приложений<br>
                - version: показать версию Soiav
            `;
            break;
        case 'neofetch':
            response.innerHTML = `
                <div class="system-info">
                    <div class="ascii-art">
                        <pre>Soiav OS 2</pre>
                    </div>
                    <div class="sys-info">
                        <div>Soiav OS 2</div>
                        <div>Версия: ${getVersionName(selectedVersion)}</div>
                        <div>Kernel: 6.4.2-soiav</div>
                        <div>DE: Soiav Desktop Environment</div>
                        <div>Shell: soiav-sh 2.1.4</div>
                    </div>
                </div>
            `;
            break;
        case 'date':
            response.textContent = new Date().toString();
            break;
        case 'clear':
            output.innerHTML = '';
            return;
        case 'apps':
            response.textContent = `Установлено приложений: ${installedApps.size}`;
            break;
        case 'version':
            response.textContent = `Soiav 2 · Версия: ${getVersionName(selectedVersion)} · Сборка 3284`;
            break;
        case '':
            return;
        default:
            if (command.startsWith('echo ')) {
                response.textContent = command.substring(5);
            } else {
                response.textContent = `Команда не найдена: ${command}. Введите 'help' для списка команд.`;
            }
    }
    
    output.appendChild(response);
}

function getVersionName(version) {
    const names = {
        'home': 'Домашняя',
        'work': 'Работа',
        'pro': 'Профессиональная',
        'server': 'Серверная β'
    };
    return names[version] || 'Домашняя';
}

// ================== ФАЙЛЫ ==================
function openFile(fileType) {
    if (fileType === 'documents' || fileType === 'images' || fileType === 'downloads' || fileType === 'music' || fileType === 'videos') {
        showNotification('Проводник', `Открыта папка: ${fileType}`);
    } else {
        openFileViewer(fileType);
    }
}

function openFileViewer(filename) {
    const fileViewer = document.getElementById('fileViewer');
    const fileViewerContent = document.getElementById('fileViewerContent');
    
    let content = '';
    let title = '';
    
    switch (filename) {
        case 'document.txt':
            title = 'Документ.txt';
            content = `
                <div class="file-content">
                    <h3>Пример документа</h3>
                    <p>Это пример текстового файла в системе Soiav 2.</p>
                    <p>Вы можете создавать, редактировать и сохранять текстовые файлы.</p>
                    <p>Дата создания: ${new Date().toLocaleDateString('ru-RU')}</p>
                </div>
            `;
            break;
        case 'image.jpg':
            title = 'Изображение.jpg';
            content = `
                <div class="file-content">
                    <h3>Просмотр изображения</h3>
                    <p>Это пример просмотра изображения в системе Soiav 2.</p>
                    <div style="background: var(--background-primary); padding: 20px; border-radius: 8px; text-align: center;">
                        <i class="fas fa-image" style="font-size: 48px; color: var(--accent-color); margin-bottom: 15px;"></i>
                        <p>Здесь будет отображаться изображение</p>
                    </div>
                    <p style="margin-top: 15px;">Размер: 2.4 MB<br>Разрешение: 1920x1080</p>
                </div>
            `;
            break;
        case 'music.mp3':
            title = 'Музыка.mp3';
            content = `
                <div class="file-content">
                    <h3>Аудио файл</h3>
                    <p>Это пример аудио файла в системе Soiav 2.</p>
                    <div style="background: var(--background-primary); padding: 20px; border-radius: 8px; text-align: center;">
                        <i class="fas fa-music" style="font-size: 48px; color: var(--accent-color); margin-bottom: 15px;"></i>
                        <p>Здесь будет воспроизводиться музыка</p>
                    </div>
                    <p style="margin-top: 15px;">Формат: MP3<br>Длительность: 3:45</p>
                </div>
            `;
            break;
    }
    
    fileViewer.querySelector('.window-header span').innerHTML = `<i class="fas fa-file"></i> ${title}`;
    fileViewerContent.innerHTML = content;
    openApp('fileViewer');
}

// ================== ДРАГ-Н-ДРОП ОКОН ==================
let dragElement = null;
let dragOffset = { x: 0, y: 0 };

document.addEventListener('mousedown', function(e) {
    if (e.target.closest('.window-header')) {
        const header = e.target.closest('.window-header');
        const window = header.parentElement;
        
        dragElement = window;
        dragOffset.x = e.clientX - window.offsetLeft;
        dragOffset.y = e.clientY - window.offsetTop;
        
        document.querySelectorAll('.window').forEach(w => {
            w.style.zIndex = '100';
        });
        window.style.zIndex = '1000';
    }
});

document.addEventListener('mousemove', function(e) {
    if (dragElement) {
        dragElement.style.left = (e.clientX - dragOffset.x) + 'px';
        dragElement.style.top = (e.clientY - dragOffset.y) + 'px';
    }
});

document.addEventListener('mouseup', function() {
    dragElement = null;
});

// Закрытие меню при клике вне
document.addEventListener('click', function(e) {
    if (!e.target.closest('.account-btn') && !e.target.closest('.account-menu')) {
        const accountMenu = document.getElementById('accountMenu');
        if (accountMenu) accountMenu.classList.remove('active');
    }
    
    if (!e.target.closest('.start-btn') && !e.target.closest('.start-menu')) {
        const startMenu = document.getElementById('startMenu');
        if (startMenu) startMenu.classList.remove('active');
    }
    
    if (!e.target.closest('.tray-icon') && !e.target.closest('.notification-center')) {
        const notificationCenter = document.getElementById('notificationCenter');
        if (notificationCenter) notificationCenter.classList.remove('active');
    }
    
    if (!e.target.closest('.tray-icon') && !e.target.closest('.side-menu')) {
        const sideMenu = document.getElementById('sideMenu');
        if (sideMenu) sideMenu.classList.remove('active');
    }
    
    if (!e.target.closest('.time-display') && !e.target.closest('.calendar-popup')) {
        const calendarPopup = document.getElementById('calendarPopup');
        if (calendarPopup) calendarPopup.classList.remove('active');
    }
});

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes startMenuSlide {
        0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
`;
document.head.appendChild(style);