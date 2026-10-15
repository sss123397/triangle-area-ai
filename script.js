// === Состояние приложения ===
const state = {
  level: 1,
  current: null,
  solved: 0,
  streak: 0,
  history: [],
};

// === Короткая функция для getElementById ===
const $ = (id) => document.getElementById(id);

const els = {
  problem: $('problem'),
  formula: $('formula'),
  hints: $('hints'),
  solution: $('solution'),
  answer: $('answer'),
  task: $('task'),
  loading: $('loading'),
  hintBtn: $('hintBtn'),
  solveBtn: $('solveBtn'),
  newBtn: $('newBtn'),
  checkBtn: $('checkBtn'),
  userAnswer: $('userAnswer'),
  feedback: $('feedback'),
  levelTag: $('levelTag'),
  methodTag: $('methodTag'),
  unitLabel: $('unitLabel'),
  svg: $('triangleSvg'),
};

// === Названия методов по уровням ===
const METHOD_LABELS = {
  1: '½ · a · h',
  2: '½ · a · h',
  3: 'Формула Герона',
  4: 'Координаты вершин',
};

// === Клики по кнопкам уровней ===
document.querySelectorAll('.level-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.level = Number(btn.dataset.level);
    generateTask();
  });
});

// === Кнопки ===
els.hintBtn.addEventListener('click', () => {
  els.hints.classList.remove('hidden');
  els.hintBtn.disabled = true;
});

els.solveBtn.addEventListener('click', () => {
  els.solution.classList.remove('hidden');
  els.answer.classList.remove('hidden');
  els.solveBtn.disabled = true;
});

els.newBtn.addEventListener('click', generateTask);
els.checkBtn.addEventListener('click', checkAnswer);
els.userAnswer.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') checkAnswer();
});

// === Генерация задачи через сервер ===
async function generateTask() {
  resetUI();
  els.loading.classList.remove('hidden');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: state.level }),
    });
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    state.current = data;
    renderTask(data);
  } catch (err) {
    console.error(err);
    els.problem.textContent = '⚠️ Не удалось сгенерировать задачу. Проверь соединение и попробуй снова.';
    els.task.classList.remove('hidden');
  } finally {
    els.loading.classList.add('hidden');
  }
}

// === Сброс интерфейса ===
function resetUI() {
  els.task.classList.add('hidden');
  els.hints.classList.add('hidden');
  els.solution.classList.add('hidden');
  els.answer.classList.add('hidden');
  els.feedback.textContent = '';
  els.feedback.className = 'feedback';
  els.userAnswer.value = '';
  els.hintBtn.disabled = false;
  els.solveBtn.disabled = false;
  els.svg.innerHTML = '';
}

// === Показ задачи ===
function renderTask(data) {
  els.levelTag.textContent = `Level ${data.level}`;
  els.methodTag.textContent = METHOD_LABELS[data.level] || '';
  els.unitLabel.textContent = data.unit || 'ед²';

  els.problem.textContent = data.problem;
  els.formula.textContent = data.formula_reminder || '';

  els.hints.innerHTML = (data.hints || []).map((h) => `<li>${h}</li>`).join('');
  els.solution.innerHTML = (data.solution_steps || []).map((s) => `<li>${s}</li>`).join('');
  els.answer.textContent = '✅ Правильный ответ: ' + data.final_answer;

  drawTriangle(data.visual);
  els.task.classList.remove('hidden');
}

// === Проверка ответа ===
function checkAnswer() {
  if (!state.current) return;
  const raw = els.userAnswer.value.trim().replace(',', '.');
  const userNum = parseFloat(raw);
  const correct = parseFloat(state.current.numeric_answer);

  if (isNaN(userNum)) {
    els.feedback.textContent = 'Введи число.';
    els.feedback.className = 'feedback warn';
    return;
  }

  const tolerance = Math.max(0.05, Math.abs(correct) * 0.01);
  const diff = Math.abs(userNum - correct);

  if (diff <= tolerance) {
    els.feedback.textContent = '🎉 Верно! Отличная работа.';
    els.feedback.className = 'feedback ok';
    state.solved++;
    state.streak++;
    pushHistory(true);
  } else {
    els.feedback.textContent = '❌ Не совсем. Попробуй ещё раз или открой подсказку.';
    els.feedback.className = 'feedback err';
    state.streak = 0;
    pushHistory(false);
  }
}

// === История ===
function pushHistory(ok) {
  state.history.unshift({
    level: state.current.level,
    answer: state.current.final_answer,
    ok,
  });
  state.history = state.history.slice(0, 5);
  renderHistory();
}

function renderHistory() {
  const list = $('historyList');
  if (!state.history.length) {
    list.innerHTML = '<li><span>Пока пусто — реши первую задачу!</span></li>';
    return;
  }
  list.innerHTML = state.history
    .map(
      (h) => `<li>
      <span>Level ${h.level} · ответ: ${h.answer}</span>
      <span class="${h.ok ? 'ok' : 'fail'}">${h.ok ? '✓ верно' : '✗ мимо'}</span>
    </li>`
    )
    .join('');
}

// === Рисование треугольника в SVG ===
function drawTriangle(v) {
  if (!v || !v.points) {
    els.svg.innerHTML =
      '<text x="150" y="130" text-anchor="middle" fill="#9ca3af">Нет данных для отображения</text>';
    return;
  }

  const W = 300,
    H = 260,
    PAD = 40;
  const xs = v.points.map((p) => p.x);
  const ys = v.points.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY);

  const project = (p) => ({
    x: PAD + (p.x - minX) * scale,
    y: H - PAD - (p.y - minY) * scale,
  });

  const pts = v.points.map(project);
  const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(' ');

  let svg = '';
  svg += `<polygon points="${polyPoints}" fill="#dbeafe" stroke="#4a6cf7" stroke-width="2.5" stroke-linejoin="round"/>`;

  const labels = ['A', 'B', 'C'];
  pts.forEach((p, i) => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#4a6cf7"/>`;
    svg += `<text x="${p.x + 8}" y="${p.y - 8}" font-size="13" font-weight="600" fill="#1a1a2e">${labels[i]}</text>`;
  });

  if (v.height_line) {
    const from = project(v.height_line.from);
    const to = project(v.height_line.to);
    svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 4"/>`;
    svg += `<text x="${(from.x + to.x) / 2 + 6}" y="${(from.y + to.y) / 2}" font-size="12" fill="#b45309" font-weight="600">h</text>`;
  }

  if (v.side_labels) {
    v.side_labels.forEach((sl) => {
      const a = project(sl.from),
        b = project(sl.to);
      const mx = (a.x + b.x) / 2,
        my = (a.y + b.y) / 2;
      svg += `<text x="${mx}" y="${my - 6}" font-size="12" fill="#4a6cf7" font-weight="600" text-anchor="middle">${sl.label}</text>`;
    });
  }

  els.svg.innerHTML = svg;
}

// === Запуск ===
renderHistory();
generateTask();