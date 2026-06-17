const SHEET_NAME = '答题记录';
const ADMIN_TOKEN = '请改成你的后台密码';
const QUESTION_START = 3;
const QUESTION_END = 54;

// 第 1 道选择题对应 q3，第 52 道选择题对应 q54。
// 示例：q3: '4' 表示第 1 题正确答案是第 4 个选项。
const ANSWER_KEY = {
};

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const callback = params.callback || '';
  let result;
  try {
    if (params.action === 'submit') {
      result = submit_(params);
    } else if (params.action === 'list') {
      result = list_(params);
    } else {
      result = { ok: true, message: '后台已连接' };
    }
  } catch (error) {
    result = { ok: false, error: error.message || String(error) };
  }
  return output_(result, callback);
}

function submit_(params) {
  if (!params.payload) throw new Error('缺少提交内容');
  const payload = JSON.parse(decodePayload_(params.payload));
  const scored = score_(payload.answers || {});
  const record = {
    id: Utilities.getUuid(),
    submittedAt: new Date(),
    name: payload.name || '',
    nameZh: payload.nameZh || '',
    nameEn: payload.nameEn || '',
    score: scored.score,
    total: scored.total,
    percent: scored.percent,
    unanswered: (payload.unansweredNumbers || []).join(', '),
    answers: JSON.stringify(payload.answers || {}),
    userAgent: payload.userAgent || ''
  };
  append_(record);
  return {
    ok: true,
    record: {
      id: record.id,
      submittedAt: record.submittedAt,
      name: record.name,
      score: record.score,
      total: record.total,
      percent: record.percent,
      unanswered: record.unanswered,
      remoteSaved: true,
      answers: payload.answers || {}
    }
  };
}

function list_(params) {
  if (params.token !== ADMIN_TOKEN) throw new Error('后台密码不正确');
  const sheet = sheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { ok: true, records: [] };
  const headers = values[0];
  const records = values.slice(1).map(function (row) {
    const item = {};
    headers.forEach(function (header, index) {
      item[header] = row[index];
    });
    item.remoteSaved = true;
    try {
      item.answers = JSON.parse(item.answers || '{}');
    } catch (error) {
      item.answers = {};
    }
    if (item.submittedAt instanceof Date) {
      item.submittedAt = Utilities.formatDate(item.submittedAt, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    }
    return item;
  }).reverse();
  return { ok: true, records: records };
}

function score_(answers) {
  const keys = Object.keys(ANSWER_KEY).filter(function (key) {
    return ANSWER_KEY[key] !== '' && ANSWER_KEY[key] !== null && ANSWER_KEY[key] !== undefined;
  });
  let score = 0;
  keys.forEach(function (key) {
    if (String(answers[key] || '') === String(ANSWER_KEY[key])) score += 1;
  });
  const total = keys.length;
  return {
    score: total ? score : null,
    total: total,
    percent: total ? Math.round(score / total * 100) : null
  };
}

function append_(record) {
  const sheet = sheet_();
  sheet.appendRow([
    record.id,
    record.submittedAt,
    record.name,
    record.nameZh,
    record.nameEn,
    record.score,
    record.total,
    record.percent,
    record.unanswered,
    record.answers,
    record.userAgent
  ]);
}

function sheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'id',
      'submittedAt',
      'name',
      'nameZh',
      'nameEn',
      'score',
      'total',
      'percent',
      'unanswered',
      'answers',
      'userAgent'
    ]);
  }
  return sheet;
}

function decodePayload_(payload) {
  let text = String(payload);
  while (text.length % 4) text += '=';
  const bytes = Utilities.base64DecodeWebSafe(text);
  return Utilities.newBlob(bytes).getDataAsString('UTF-8');
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  const text = callback ? callback + '(' + json + ');' : json;
  const mime = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
  return ContentService.createTextOutput(text).setMimeType(mime);
}
