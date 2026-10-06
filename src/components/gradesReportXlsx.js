const DIFFICULTY = {EASY: 'Лёгкая', MEDIUM: 'Средняя', HARD: 'Сложная'};
const DIFFICULTY_COLOR = {EASY: 'FFC8E6C9', MEDIUM: 'FFFFE0B2', HARD: 'FFFFCDD2'};
const GRADE_COLOR = {5: 'FF81C784', 4: 'FFAED581', 3: 'FFFFD54F', 2: 'FFE57373'};

const BORDER = {style: 'thin', color: {argb: 'FFBDBDBD'}};
const BORDERS = {top: BORDER, left: BORDER, bottom: BORDER, right: BORDER};
const fill = (argb) => ({type: 'pattern', pattern: 'solid', fgColor: {argb}});

// Оценка по баллам и сколько баллов не хватает до следующей.
const gradeByPoints = (report, points) => {
    if (points >= report.minPointsFor5) return 5;
    if (points >= report.minPointsFor4) return 4;
    if (points >= report.minPointsFor3) return 3;
    return 2;
};

const nextStep = (report, points) => {
    const next = {2: [3, report.minPointsFor3], 3: [4, report.minPointsFor4], 4: [5, report.minPointsFor5]}[gradeByPoints(report, points)];
    if (!next) return 'максимальная оценка';
    const left = Math.round((next[1] - points) * 100) / 100;
    return `ещё ${left} б. до «${next[0]}»`;
};

// Красивый xlsx: шапка с правилами, цветная таблица баллов, итог и оценка.
export const buildGradesWorkbook = async (report) => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Оценки', {
        views: [{state: 'frozen', xSplit: 2, ySplit: 0, showGridLines: false}],
        pageSetup: {orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0},
    });

    const n = report.problems.length;
    const lastCol = 2 + n + 4; // №, Студент, задачи, Итого, %, Оценка, До следующей
    const merge = (row, from, to) => ws.mergeCells(row, from, row, to);

    // Заголовок
    ws.getRow(1).height = 30;
    ws.getCell(1, 1).value = report.articleTitle;
    ws.getCell(1, 1).font = {size: 18, bold: true, color: {argb: 'FF1A237E'}};
    ws.getCell(1, 1).alignment = {vertical: 'middle'};
    merge(1, 1, lastCol);
    ws.getCell(2, 1).value = `Группа ${report.groupName}  •  сформировано ${new Date().toLocaleDateString('ru-RU')}`;
    ws.getCell(2, 1).font = {size: 11, color: {argb: 'FF616161'}};
    merge(2, 1, lastCol);

    // Правила: сколько баллов нужно на каждую оценку
    ws.getCell(4, 1).value = 'Сколько баллов нужно на оценку';
    ws.getCell(4, 1).font = {bold: true, size: 12};
    merge(4, 1, lastCol);
    const rules = [
        ['«5»', report.minPointsFor5, 5],
        ['«4»', report.minPointsFor4, 4],
        ['«3»', report.minPointsFor3, 3],
    ];
    rules.forEach(([label, min, grade], i) => {
        const r = 5 + i;
        ws.getCell(r, 2).value = `Оценка ${label}`;
        ws.getCell(r, 3).value = `от ${min} из ${report.maxPoints} баллов`;
        ws.getCell(r, 2).fill = fill(GRADE_COLOR[grade]);
        ws.getCell(r, 2).font = {bold: true};
        ws.getCell(r, 2).border = BORDERS;
        ws.getCell(r, 3).border = BORDERS;
        merge(r, 3, Math.min(lastCol, 6));
    });
    ws.getCell(8, 2).value = 'Баллы за задачу: ' + ['EASY', 'MEDIUM', 'HARD']
        .map((d) => {
            const p = report.problems.find((x) => x.difficulty === d);
            return p ? `${DIFFICULTY[d].toLowerCase()} — ${p.points}` : null;
        }).filter(Boolean).join(', ');
    ws.getCell(8, 2).font = {italic: true, color: {argb: 'FF616161'}};
    merge(8, 2, lastCol);

    // Шапка таблицы
    const headerRow = 10;
    const headers = ['№', 'Студент', ...report.problems.map((p) => p.title), 'Баллов', '%', 'Оценка', 'Что дальше'];
    ws.getRow(headerRow).height = 62;
    headers.forEach((text, i) => {
        const c = ws.getCell(headerRow, i + 1);
        c.value = text;
        c.font = {bold: true};
        c.alignment = {horizontal: 'center', vertical: 'middle', wrapText: true};
        c.border = BORDERS;
        c.fill = fill('FFE8EAF6');
    });
    report.problems.forEach((p, i) => {
        const c = ws.getCell(headerRow, 3 + i);
        c.value = `${p.title}\n${DIFFICULTY[p.difficulty] || p.difficulty} · ${p.points} б.`;
        c.fill = fill(DIFFICULTY_COLOR[p.difficulty] || 'FFE8EAF6');
    });

    // Строки студентов
    report.students.forEach((s, idx) => {
        const r = headerRow + 1 + idx;
        const solved = new Set(s.solvedProblemIds);
        const percent = report.maxPoints ? s.points / report.maxPoints : 0;
        ws.getRow(r).height = 22;

        const cells = [
            [1, idx + 1, 'center'],
            [2, s.fullName, 'left'],
        ];
        report.problems.forEach((p, i) => {
            const done = solved.has(p.id);
            const earned = done ? (s.earnedByProblem?.[p.id] ?? p.points) : 0;
            const partial = done && earned < p.points;
            const c = ws.getCell(r, 3 + i);
            c.value = earned;
            c.numFmt = '0.##';
            c.alignment = {horizontal: 'center', vertical: 'middle'};
            c.border = BORDERS;
            c.fill = fill(partial ? 'FFFFF3C4' : done ? 'FFC8E6C9' : 'FFF5F5F5');
            c.font = {color: {argb: partial ? 'FF7A5B00' : done ? 'FF1B5E20' : 'FF9E9E9E'}, bold: done};
        });
        const base = 3 + n;
        cells.push(
            [base, Math.round(s.points * 100) / 100, 'center'],
            [base + 1, percent, 'center'],
            [base + 2, s.grade ?? '—', 'center'],
            [base + 3, nextStep(report, s.points), 'left'],
        );
        cells.forEach(([col, value, align]) => {
            const c = ws.getCell(r, col);
            c.value = value;
            c.alignment = {horizontal: align, vertical: 'middle', wrapText: col === base + 3};
            c.border = BORDERS;
        });
        ws.getCell(r, 2).font = {bold: true};
        ws.getCell(r, base).font = {bold: true};
        ws.getCell(r, base + 1).numFmt = '0%';
        const g = ws.getCell(r, base + 2);
        g.font = {bold: true, size: 13};
        if (s.grade) g.fill = fill(GRADE_COLOR[s.grade]);
        else g.fill = fill('FFEEEEEE');
    });

    // Ширина колонок
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 34;
    for (let i = 0; i < n; i++) ws.getColumn(3 + i).width = 17;
    ws.getColumn(3 + n).width = 9;
    ws.getColumn(4 + n).width = 7;
    ws.getColumn(5 + n).width = 9;
    ws.getColumn(6 + n).width = 24;

    return wb;
};

export const downloadGradesXlsx = async (report) => {
    const wb = await buildGradesWorkbook(report);
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Оценки — ${report.articleTitle} — ${report.groupName}.xlsx`.replace(/[\\/:*?"<>|]/g, '_');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};
