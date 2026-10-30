/* Finanzas App — plantilla de la hoja "Finanzas personales".
   Crea las mismas pestañas que la hoja original (Movimientos, Cuentas por pagar,
   Deudas, Metas, Listas, Resumen) más Perfil. Las columnas marcadas (f) son fórmulas;
   la app solo escribe filas de datos. Locale en_US para que las fórmulas usen comas. */
(function (root) {
  'use strict';
  const MONEY = '$#,##0;($#,##0);"-"';
  const DATE = 'd/mm/yyyy';
  const PCT = '0.0%';
  const IDS = { resumen: 100, mov: 101, bills: 102, debts: 103, goals: 104, lists: 105, perfil: 106 };
  const TITLES = { resumen: 'Resumen', mov: 'Movimientos', bills: 'Cuentas por pagar', debts: 'Deudas', goals: 'Metas', lists: 'Listas', perfil: 'Perfil' };
  const q = t => (/[^A-Za-z0-9]/.test(t) ? `'${t}'` : t);

  const TIPOS = ['Ingreso', 'Gasto', 'Pago de deuda', 'Ahorro'];
  const CATEGORIES = [
    ['Ingreso', 'Salario'], ['Ingreso', 'Clases / freelance'], ['Ingreso', 'Otros ingresos'],
    ['Gasto', 'Arriendo'], ['Gasto', 'Servicios e internet'], ['Gasto', 'Mercado'], ['Gasto', 'Transporte'],
    ['Gasto', 'Salud'], ['Gasto', 'Educación'], ['Gasto', 'Recreación y restaurantes'], ['Gasto', 'Suscripciones'],
    ['Gasto', 'Cuidado personal'], ['Gasto', 'Familia'], ['Gasto', 'Regalos'], ['Gasto', 'Otros gastos'],
    ['Pago de deuda', 'Deudas'], ['Ahorro', 'Ahorro']
  ];
  const METODOS = ['Nequi', 'Daviplata', 'Efectivo', 'Transferencia bancaria'];

  function build(opts) {
    const n = Object.assign({ bills: 60, debts: 30, goals: 30, budget: 30, movRows: 5000, listRows: 60 }, opts || {});
    const B = q(TITLES.bills), M = TITLES.mov, D = TITLES.debts, G = TITLES.goals, L = TITLES.lists;
    const grid = (rows, cols, frozen) => ({ rowCount: rows, columnCount: cols, frozenRowCount: frozen || 0 });
    const createBody = {
      properties: { title: 'Finanzas personales', locale: 'en_US', timeZone: (opts && opts.timeZone) || 'America/Bogota' },
      sheets: [
        { properties: { sheetId: IDS.resumen, title: TITLES.resumen, index: 0, gridProperties: grid(60, 10, 0) } },
        { properties: { sheetId: IDS.mov, title: TITLES.mov, index: 1, gridProperties: grid(n.movRows, 7, 1) } },
        { properties: { sheetId: IDS.bills, title: TITLES.bills, index: 2, gridProperties: grid(n.bills + 40, 15, 1) } },
        { properties: { sheetId: IDS.debts, title: TITLES.debts, index: 3, gridProperties: grid(n.debts + 20, 12, 1) } },
        { properties: { sheetId: IDS.goals, title: TITLES.goals, index: 4, gridProperties: grid(n.goals + 20, 8, 1) } },
        { properties: { sheetId: IDS.lists, title: TITLES.lists, index: 5, gridProperties: grid(n.listRows + 140, 8, 1) } },
        { properties: { sheetId: IDS.perfil, title: TITLES.perfil, index: 6, gridProperties: grid(30, 2, 1) } }
      ]
    };

    // ---------- formatting + validation (spreadsheets.batchUpdate) ----------
    const R = (sheetId, r0, r1, c0, c1) => ({ sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 });
    const fmt = (range, type, pattern) => ({ repeatCell: { range, cell: { userEnteredFormat: { numberFormat: { type, pattern } } }, fields: 'userEnteredFormat.numberFormat' } });
    const head = (sheetId, cols) => ({ repeatCell: { range: R(sheetId, 0, 1, 0, cols), cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColorStyle: { rgbColor: { red: 0.94, green: 0.94, blue: 0.94 } } } }, fields: 'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColorStyle' } });
    const listRule = (range, ref) => ({ setDataValidation: { range, rule: { condition: { type: 'ONE_OF_RANGE', values: [{ userEnteredValue: ref }] }, strict: false, showCustomUi: true } } });
    const valuesRule = (range, vals) => ({ setDataValidation: { range, rule: { condition: { type: 'ONE_OF_LIST', values: vals.map(v => ({ userEnteredValue: v })) }, strict: false, showCustomUi: true } } });
    const width = (sheetId, c0, c1, px) => ({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: c0, endIndex: c1 }, properties: { pixelSize: px }, fields: 'pixelSize' } });
    const mr = n.movRows, br = n.bills + 1, dr = n.debts + 1, gr = n.goals + 1, lr = n.listRows + 1;
    const requests = [
      head(IDS.mov, 7), head(IDS.bills, 12), head(IDS.debts, 12), head(IDS.goals, 8), head(IDS.lists, 8), head(IDS.perfil, 2),
      { repeatCell: { range: R(IDS.resumen, 0, 1, 0, 1), cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } }, fields: 'userEnteredFormat.textFormat' } },
      { repeatCell: { range: R(IDS.resumen, 5, 6, 0, 8), cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColorStyle: { rgbColor: { red: 0.94, green: 0.94, blue: 0.94 } } } }, fields: 'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColorStyle' } },
      { repeatCell: { range: R(IDS.resumen, 39, 40, 0, 7), cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColorStyle: { rgbColor: { red: 0.94, green: 0.94, blue: 0.94 } } } }, fields: 'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColorStyle' } },
      // Movimientos
      fmt(R(IDS.mov, 1, mr, 0, 1), 'DATE', DATE), fmt(R(IDS.mov, 1, mr, 4, 5), 'NUMBER', MONEY),
      listRule(R(IDS.mov, 1, mr, 1, 2), `=${L}!$A$2:$A$5`), listRule(R(IDS.mov, 1, mr, 2, 3), `=${L}!$C$2:$C$${lr}`),
      listRule(R(IDS.mov, 1, mr, 5, 6), `=${L}!$F$2:$F$40`), listRule(R(IDS.mov, 1, mr, 6, 7), `=${L}!$H$2:$H$200`),
      width(IDS.mov, 2, 4, 200), width(IDS.mov, 5, 7, 190),
      // Cuentas por pagar
      fmt(R(IDS.bills, 1, br, 2, 3), 'NUMBER', MONEY), fmt(R(IDS.bills, 1, br, 4, 5), 'NUMBER', MONEY),
      fmt(R(IDS.bills, 1, br, 5, 7), 'DATE', DATE), fmt(R(IDS.bills, 1, br, 7, 8), 'NUMBER', '0'),
      fmt(R(IDS.bills, 1, br, 10, 12), 'TEXT', '@'), fmt(R(IDS.bills, 0, 3, 14, 15), 'DATE', DATE),
      listRule(R(IDS.bills, 1, br, 1, 2), `=${L}!$C$2:$C$${lr}`), width(IDS.bills, 0, 2, 190), width(IDS.bills, 13, 14, 230),
      // Deudas
      fmt(R(IDS.debts, 1, dr, 2, 3), 'NUMBER', MONEY), fmt(R(IDS.debts, 1, dr, 3, 4), 'DATE', DATE),
      fmt(R(IDS.debts, 1, dr, 4, 5), 'NUMBER', MONEY), fmt(R(IDS.debts, 1, dr, 6, 9), 'NUMBER', MONEY), fmt(R(IDS.debts, 1, dr, 9, 10), 'PERCENT', PCT),
      valuesRule(R(IDS.debts, 1, dr, 1, 2), ['Tarjeta de crédito', 'Préstamo', 'Otro']), width(IDS.debts, 0, 1, 190),
      // Metas
      fmt(R(IDS.goals, 1, gr, 1, 5), 'NUMBER', MONEY), fmt(R(IDS.goals, 1, gr, 5, 6), 'PERCENT', PCT), fmt(R(IDS.goals, 1, gr, 7, 8), 'NUMBER', MONEY), width(IDS.goals, 0, 1, 190),
      // Listas
      fmt(R(IDS.lists, 1, lr, 3, 4), 'NUMBER', MONEY), valuesRule(R(IDS.lists, 1, lr, 1, 2), TIPOS), width(IDS.lists, 2, 3, 200), width(IDS.lists, 7, 8, 220),
      // Perfil
      width(IDS.perfil, 0, 1, 260), width(IDS.perfil, 1, 2, 200),
      // Resumen
      fmt(R(IDS.resumen, 2, 3, 1, 2), 'DATE', 'mm/yyyy'), fmt(R(IDS.resumen, 3, 4, 1, 2), 'DATE', DATE),
      fmt(R(IDS.resumen, 6, 8, 1, 2), 'NUMBER', MONEY), fmt(R(IDS.resumen, 8, 9, 1, 2), 'PERCENT', PCT), fmt(R(IDS.resumen, 9, 15, 1, 2), 'NUMBER', MONEY),
      fmt(R(IDS.resumen, 15, 17, 1, 2), 'NUMBER', '0'), fmt(R(IDS.resumen, 17, 19, 1, 2), 'NUMBER', MONEY),
      fmt(R(IDS.resumen, 6, 6 + n.budget, 4, 7), 'NUMBER', MONEY), fmt(R(IDS.resumen, 6, 6 + n.budget, 7, 8), 'PERCENT', PCT),
      fmt(R(IDS.resumen, 40, 52, 0, 1), 'DATE', 'mm/yyyy'), fmt(R(IDS.resumen, 40, 52, 1, 7), 'NUMBER', MONEY),
      width(IDS.resumen, 0, 1, 300), width(IDS.resumen, 1, 2, 130), width(IDS.resumen, 3, 4, 200)
    ];

    // ---------- values and formulas (values.batchUpdate, USER_ENTERED) ----------
    const data = [];
    const put = (range, values) => data.push({ range, values });
    put(`${M}!A1:G1`, [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Método de pago', 'Cuenta, deuda o meta']]);

    // Cuentas por pagar
    put(`${B}!A1:L1`, [['Cuenta', 'Categoría', 'Monto', 'Día límite', 'Pagado este mes', 'Fecha límite este mes', 'Próximo vencimiento', 'Días restantes', 'Estado', 'Notas', 'Primer mes', 'Último mes']]);
    put(`${B}!N1:O4`, [['Hoy', '=TODAY()'], ['Inicio del mes', '=EOMONTH(O1,-1)+1'], ['Inicio del próximo mes', '=EOMONTH(O1,0)+1'], ['Avisar con (días de anticipación)', 5]]);
    const MS = x => `IF(ISNUMBER(${x}),DATE(YEAR(${x}),MONTH(${x}),1),DATE(VALUE(RIGHT(${x},4)),VALUE(LEFT(${x},FIND("/",${x})-1)),1))`;
    const billRows = [];
    for (let r = 2; r <= n.bills + 1; r++) {
      billRows.push([
        `=IF(A${r}="","",SUMIFS(${M}!$E:$E,${M}!$G:$G,A${r},${M}!$A:$A,">="&$O$2,${M}!$A:$A,"<"&$O$3))`,
        `=IF(A${r}="","",DATE(YEAR($O$1),MONTH($O$1),MIN(D${r},DAY(EOMONTH($O$1,0)))))`,
        `=IF(A${r}="","",IF(E${r}>0,DATE(YEAR($O$3),MONTH($O$3),MIN(D${r},DAY(EOMONTH($O$3,0)))),F${r}))`,
        `=IF(A${r}="","",G${r}-$O$1)`,
        `=IF(A${r}="","",IF(AND(L${r}<>"",IFERROR(${MS('L' + r)}<$O$2,FALSE)),"Terminada",IF(AND(K${r}<>"",IFERROR(${MS('K' + r)}>$O$2,FALSE)),"Programada",IF(E${r}>0,"Pagada",IF(H${r}<0,"Vencida",IF(H${r}<=$O$4,"Vence pronto","Pendiente"))))))`
      ]);
    }
    put(`${B}!E2:I${n.bills + 1}`, billRows);

    // Deudas
    put(`${D}!A1:L1`, [['Deuda', 'Tipo', 'Saldo inicial', 'Fecha del saldo', 'Cuota mensual', 'Día de pago', 'Compras con la tarjeta', 'Pagos registrados', 'Saldo actual', '% pagado', 'Progreso', 'Meses restantes (aprox.)']]);
    const debtRows = [];
    for (let r = 2; r <= n.debts + 1; r++) {
      debtRows.push([
        `=IF(A${r}="","",IF(B${r}="Tarjeta de crédito",SUMIFS(${M}!$E:$E,${M}!$F:$F,A${r},${M}!$B:$B,"Gasto",${M}!$A:$A,">="&N(D${r})),0))`,
        `=IF(A${r}="","",SUMIFS(${M}!$E:$E,${M}!$G:$G,A${r},${M}!$B:$B,"Pago de deuda",${M}!$A:$A,">="&N(D${r})))`,
        `=IF(A${r}="","",N(C${r})+G${r}-H${r})`,
        `=IF(A${r}="","",IF(N(C${r})+G${r}=0,"",H${r}/(N(C${r})+G${r})))`,
        `=IF(J${r}="","",REPT("■",ROUND(MIN(1,MAX(0,J${r}))*10))&REPT("□",10-ROUND(MIN(1,MAX(0,J${r}))*10)))`,
        `=IF(OR(A${r}="",N(E${r})=0),"",ROUNDUP(MAX(0,I${r})/E${r},0))`
      ]);
    }
    put(`${D}!G2:L${n.debts + 1}`, debtRows);

    // Metas
    put(`${G}!A1:H1`, [['Meta', 'Monto meta', 'Ahorrado antes de empezar', 'Aportes registrados', 'Total ahorrado', '% logrado', 'Progreso', 'Falta']]);
    const goalRows = [];
    for (let r = 2; r <= n.goals + 1; r++) {
      goalRows.push([
        `=IF(A${r}="","",SUMIFS(${M}!$E:$E,${M}!$G:$G,A${r},${M}!$B:$B,"Ahorro"))`,
        `=IF(A${r}="","",N(C${r})+D${r})`,
        `=IF(OR(A${r}="",N(B${r})=0),"",MIN(1,E${r}/B${r}))`,
        `=IF(F${r}="","",REPT("■",ROUND(F${r}*10))&REPT("□",10-ROUND(F${r}*10)))`,
        `=IF(OR(A${r}="",N(B${r})=0),"",MAX(0,B${r}-E${r}))`
      ]);
    }
    put(`${G}!D2:H${n.goals + 1}`, goalRows);

    // Listas (categorías y métodos los escribe la guía de presupuesto)
    put(`${L}!A1:H1`, [['Tipo', 'Tipo de categoría', 'Categoría', 'Presupuesto mensual', '', 'Método de pago', '', 'Cuenta, deuda o meta']]);
    put(`${L}!A2:A5`, TIPOS.map(t => [t]));
    put(`${L}!B2:C${1 + CATEGORIES.length}`, CATEGORIES.map(([t, c]) => [t, c]));
    put(`${L}!F2:F${1 + METODOS.length}`, METODOS.map(m => [m]));
    put(`${L}!H2`, [[`=IFERROR(QUERY({${B}!A2:A${n.bills + 1};${D}!A2:A${n.debts + 1};${G}!A2:A${n.goals + 1}},"select Col1 where Col1 is not null",0),"")`]]);

    // Perfil
    put(`Perfil!A1:B6`, [['Campo', 'Valor'], ['Nombre', ''], ['Ingreso mensual esperado', ''], ['Días de pago', ''], ['Meses de fondo de emergencia', 3], ['Creada con', 'Finanzas App']]);

    // Resumen
    const inMonth = `${M}!$A:$A,">="&$B$3,${M}!$A:$A,"<="&$B$4`;
    const cardMatch = (from, to) => `IFERROR(SUMPRODUCT((${M}!$B$2:$B$${mr}="Gasto")*(${M}!$A$2:$A$${mr}>=${from})*(${M}!$A$2:$A$${mr}<=${to})*ISNUMBER(MATCH(${M}!$F$2:$F$${mr},FILTER(${D}!$A$2:$A$${dr},${D}!$B$2:$B$${dr}="Tarjeta de crédito"),0))*${M}!$E$2:$E$${mr}),0)`;
    put('Resumen!A1', [['Resumen mensual']]);
    put('Resumen!A3:B4', [['Mes', '=DATE(YEAR(TODAY()),MONTH(TODAY()),1)'], ['Fin del mes', '=EOMONTH(B3,0)']]);
    put('Resumen!A6:B19', [
      ['Flujo del mes', 'Valor'],
      ['Ingresos', `=SUMIFS(${M}!$E:$E,${M}!$B:$B,"Ingreso",${inMonth})`],
      ['Gastos (todas las formas de pago)', `=SUMIFS(${M}!$E:$E,${M}!$B:$B,"Gasto",${inMonth})`],
      ['% de ingresos gastado', '=IF(B7=0,"",B8/B7)'],
      ['Gastos con tarjeta de crédito', `=${cardMatch('$B$3', '$B$4')}`],
      ['Pagos a deudas', `=SUMIFS(${M}!$E:$E,${M}!$B:$B,"Pago de deuda",${inMonth})`],
      ['Ahorro e inversión', `=SUMIFS(${M}!$E:$E,${M}!$B:$B,"Ahorro",${inMonth})`],
      ['Salidas de dinero (sin compras con tarjeta)', '=B8-B10+B11+B12'],
      ['Saldo del mes', '=B7-B13'],
      ['Deuda total', `=SUM(${D}!I2:I${dr})`],
      ['Cuentas que vencen pronto', `=COUNTIF(${B}!I2:I${br},"Vence pronto")`],
      ['Cuentas vencidas', `=COUNTIF(${B}!I2:I${br},"Vencida")`],
      ['Por pagar este mes', `=SUMIFS(${B}!C2:C${br},${B}!I2:I${br},"Vencida")+SUMIFS(${B}!C2:C${br},${B}!I2:I${br},"Vence pronto")+SUMIFS(${B}!C2:C${br},${B}!I2:I${br},"Pendiente")`],
      ['Te queda después de cuentas', '=B14-B18']
    ]);
    const budRows = [['Categoría', 'Presupuesto', 'Gastado', 'Disponible', '% usado']];
    for (let r = 7; r < 7 + n.budget; r++) {
      budRows.push([
        `=IFERROR(INDEX(FILTER(${L}!$C$2:$C$${lr},${L}!$B$2:$B$${lr}="Gasto"),ROW()-6),"")`,
        `=IF(D${r}="","",SUMIF(${L}!$C$2:$C$${lr},D${r},${L}!$D$2:$D$${lr}))`,
        `=IF(D${r}="","",SUMIFS(${M}!$E:$E,${M}!$C:$C,D${r},${M}!$B:$B,"Gasto",${inMonth}))`,
        `=IF(D${r}="","",E${r}-F${r})`,
        `=IF(OR(D${r}="",N(E${r})=0),"",F${r}/E${r})`
      ]);
    }
    put(`Resumen!D6:H${6 + n.budget}`, budRows);
    const hist = [['Mes', 'Ingresos', 'Gastos', 'Con tarjeta', 'Pagos a deudas', 'Ahorro', 'Saldo']];
    for (let r = 41; r <= 52; r++) {
      const sm = t => `=SUMIFS(${M}!$E:$E,${M}!$B:$B,"${t}",${M}!$A:$A,">="&A${r},${M}!$A:$A,"<="&EOMONTH(A${r},0))`;
      hist.push([`=EDATE($B$3,${r - 52})`, sm('Ingreso'), sm('Gasto'), `=${cardMatch('A' + r, 'EOMONTH(A' + r + ',0)')}`, sm('Pago de deuda'), sm('Ahorro'), `=B${r}-(C${r}-D${r}+E${r}+F${r})`]);
    }
    put('Resumen!A39', [['Últimos 12 meses']]);
    put('Resumen!A40:G52', hist);
    put('Resumen!A55:A58', [['Cómo funciona esta hoja'], ['1. Finanzas App agrega una fila en Movimientos por cada ingreso, gasto, pago de deuda o ahorro.'], ['2. Las columnas de Cuentas por pagar, Deudas, Metas y este Resumen se calculan solas con fórmulas.'], ['3. Cuentas, deudas, metas y presupuestos se configuran desde la guía de presupuesto de la app, o aquí mismo.']]);

    return { createBody, requests, data, ids: IDS, titles: TITLES, categories: CATEGORIES, metodos: METODOS, tipos: TIPOS };
  }

  const api = { build, IDS, TITLES, CATEGORIES, METODOS, TIPOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FinanzasTemplate = api;
})(typeof window !== 'undefined' ? window : globalThis);
