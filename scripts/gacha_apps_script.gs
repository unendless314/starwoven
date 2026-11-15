var SHEET_NAMES = {
  CODES: '抽獎碼',
  DRAWS: '抽獎紀錄',
  POOL: '獎池設定',
  AUTH: '授權名單',
  FORM_A: '表單A回應',
  FORM_B: '表單B回應',
  FORM_C: '表單C回應',
};

var HEADERS = {
  CODES: ['抽獎碼', '類型', '活動代號', '已購項目', '活動名額', '狀態', '發放日', '發放人', '抽獎連結', '備註'],
  DRAWS: ['抽獎編號', '抽獎碼', '時間', '抽中項目', '處理狀態', '登記受理時間', '登記人', '備註'],
  POOL: ['項目', '狀態'],
  AUTH: ['email', '姓名'],
};

var ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
var DRAW_ID_PATTERN = /^G-[A-HJ-KM-NP-Z2-9]{10}$/;
var CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
var CAMPAIGN_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;
var RECORD_STATUSES = ['已登記', '已體驗', '已轉換'];
var TIME_ZONE = 'Asia/Taipei';
var SITE_GACHA_URL = 'https://starwoven.xyz/gacha#code=';

function respond(e, payload) {
  var json = JSON.stringify(payload);
  var callback = e && e.parameter ? e.parameter.callback : null;
  if (callback && /^[a-zA-Z_$][a-zA-Z0-9_$]{0,98}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function successResponse(result) {
  return {
    status: 'success',
    draw_id: result.drawId,
    prize: result.prize,
    code_type: result.codeType,
    repeated: result.repeated === true,
  };
}

function errorResponse(code, message) {
  return { status: 'error', code: code, message: message };
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  var code = normalizeCode(e && e.parameter ? e.parameter.code : '');
  if (action !== 'redeem') return respond(e, errorResponse('INVALID_ACTION', '不支援的操作'));
  if (!CODE_PATTERN.test(code)) return respond(e, errorResponse('INVALID_CODE', '無效抽獎碼'));

  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();
  var locked = false;

  try {
    var preliminary = findCodeRow(code);
    if (!preliminary) return respond(e, errorResponse('INVALID_CODE', '無效抽獎碼'));
    if (cell(preliminary.table, preliminary.row, '狀態') !== '啟用') {
      return respond(e, errorResponse('INACTIVE_CODE', '活動已結束'));
    }

    var codeType = cell(preliminary.table, preliminary.row, '類型');
    if (codeType !== '一次性' && codeType !== '公開') {
      return respond(e, errorResponse('INVALID_CODE', '抽獎碼設定有誤'));
    }

    var existing = codeType === '一次性' ? findDrawByCode(code) : null;
    if (existing) {
      return respond(e, successResponse({
        drawId: cell(existing.table, existing.row, '抽獎編號'),
        prize: cell(existing.table, existing.row, '抽中項目'),
        codeType: codeType,
        repeated: true,
      }));
    }

    if (codeType === '公開' && isRateLimited(cache, code)) {
      return respond(e, errorResponse('RATE_LIMITED', '抽太快了，請稍後再試'));
    }

    locked = lock.tryLock(codeType === '公開' ? 3000 : 10000);
    if (!locked) return respond(e, errorResponse('BUSY', '請稍後再試'));

    var latest = findCodeRow(code);
    if (!latest) return respond(e, errorResponse('INVALID_CODE', '無效抽獎碼'));
    if (cell(latest.table, latest.row, '狀態') !== '啟用') {
      return respond(e, errorResponse('INACTIVE_CODE', '活動已結束'));
    }

    codeType = cell(latest.table, latest.row, '類型');
    if (codeType !== '一次性' && codeType !== '公開') {
      return respond(e, errorResponse('INVALID_CODE', '抽獎碼設定有誤'));
    }

    existing = codeType === '一次性' ? findDrawByCode(code) : null;
    if (existing) {
      return respond(e, successResponse({
        drawId: cell(existing.table, existing.row, '抽獎編號'),
        prize: cell(existing.table, existing.row, '抽中項目'),
        codeType: codeType,
        repeated: true,
      }));
    }

    if (codeType === '公開' && isRateLimited(cache, code)) {
      return respond(e, errorResponse('RATE_LIMITED', '抽太快了，請稍後再試'));
    }

    var poolTable = readTable(SHEET_NAMES.POOL, HEADERS.POOL);
    var openPrizes = poolTable.rows
      .filter(function (row) { return cell(poolTable, row, '狀態') === '開放'; })
      .map(function (row) { return cell(poolTable, row, '項目'); })
      .filter(function (prize) { return prize !== ''; });
    if (openPrizes.length === 0) return respond(e, errorResponse('POOL_EMPTY', '暫無可抽項目'));

    var purchased = parseList(cell(latest.table, latest.row, '已購項目'));
    var eligible = openPrizes.filter(function (prize) { return purchased.indexOf(prize) === -1; });
    if (eligible.length === 0) {
      return respond(e, errorResponse('NO_ELIGIBLE_PRIZE', '請洽官方 LINE'));
    }

    var drawTable = readTable(SHEET_NAMES.DRAWS, HEADERS.DRAWS);
    var drawId = generateUniqueDrawId(drawTable);
    var result = {
      drawId: drawId,
      prize: eligible[randomIndex(eligible.length)],
      codeType: codeType,
      repeated: false,
    };
    var values = {};
    values['抽獎編號'] = result.drawId;
    values['抽獎碼'] = code;
    values['時間'] = new Date();
    values['抽中項目'] = result.prize;
    values['處理狀態'] = '';
    values['登記受理時間'] = '';
    values['登記人'] = '';
    values['備註'] = '';
    appendRow(drawTable, values);

    // 試算表寫入成功後，附屬 flush／快取失敗不可改回錯誤，避免一次性碼客人誤以為需要重抽。
    try { SpreadsheetApp.flush(); } catch (postCommitError) {}
    if (codeType === '公開') {
      try { incrementRateLimits(cache, code); } catch (cacheError) {}
    }
    return respond(e, successResponse(result));
  } catch (error) {
    console.error('gacha redeem failed: ' + error.message);
    return respond(e, errorResponse('INTERNAL_ERROR', '請稍後再試'));
  } finally {
    if (locked) lock.releaseLock();
  }
}

function onFormSubmit(e) {
  var sheetName = e && e.range ? e.range.getSheet().getName() : '';
  var kind = sheetName === SHEET_NAMES.FORM_A ? 'A' : sheetName === SHEET_NAMES.FORM_B ? 'B' : sheetName === SHEET_NAMES.FORM_C ? 'C' : '';
  if (!kind) return;

  var email = formValue(e, ['電子郵件地址', 'Email Address', '電子郵件', 'Email']).trim();
  var mail = null;
  var lock = LockService.getScriptLock();
  var locked = false;

  try {
    if (!isValidEmail(email)) {
      console.error('gacha form ' + kind + ': missing verified respondent email');
      return;
    }
    if (!isAuthorized(email)) {
      mail = {
        subject: '【星靈扭蛋】操作未執行：帳號未授權',
        body: '此 Google 帳號不在星靈扭蛋授權名單內，本次表單內容未寫入正式資料。',
      };
    } else {
      locked = lock.tryLock(15000);
      if (!locked) {
        mail = { subject: '【星靈扭蛋】操作未完成', body: '系統目前忙碌中，請稍後重新送出表單。' };
      } else if (kind === 'A') {
        mail = handleFormA(e, email);
      } else if (kind === 'B') {
        mail = handleFormB(e, email);
      } else {
        mail = handleFormC(e, email);
      }
    }
  } catch (error) {
    console.error('gacha form ' + kind + ' failed: ' + error.message);
    mail = {
      subject: '【星靈扭蛋】操作未完成：系統設定異常',
      body: '系統無法完成本次操作，請聯絡開發者並提供表單送出時間。\n\n技術訊息：' + error.message,
    };
  } finally {
    if (locked) lock.releaseLock();
  }

  if (mail) MailApp.sendEmail(email, mail.subject, mail.body);
}

function handleFormA(e, email) {
  var purchasedText = formValue(e, ['客戶已購項目']);
  var note = formValue(e, ['客戶備註事項']).trim();
  if (note.length > 500) return formFailure('客戶備註事項超過 500 字，請縮短後重新送出。');

  var poolTable = readTable(SHEET_NAMES.POOL, HEADERS.POOL);
  var validPrizes = poolTable.rows.map(function (row) { return cell(poolTable, row, '項目'); });
  var purchased = parseList(purchasedText);
  for (var i = 0; i < purchased.length; i++) {
    if (validPrizes.indexOf(purchased[i]) === -1) {
      return formFailure('客戶已購項目「' + purchased[i] + '」不在獎池設定中，請檢查表單選項。');
    }
  }

  var codeTable = readTable(SHEET_NAMES.CODES, HEADERS.CODES);
  var code = generateUniqueCode(codeTable, 8);
  var values = emptyRow(HEADERS.CODES);
  values['抽獎碼'] = code;
  values['類型'] = '一次性';
  values['活動代號'] = 'purchase';
  values['已購項目'] = purchased.join('、');
  values['狀態'] = '啟用';
  values['發放日'] = new Date();
  values['發放人'] = email;
  values['抽獎連結'] = SITE_GACHA_URL + code;
  values['備註'] = plainText(note);
  appendRow(codeTable, values);
  try { SpreadsheetApp.flush(); } catch (postCommitError) {}

  return {
    subject: '【星靈扭蛋】付費碼（' + (purchased.join('、') || '未填已購項目') + '）' + formatDate(new Date(), 'MM/dd HH:mm'),
    body: '一次性抽獎碼已建立，請將以下連結私訊給客人：\n\n' + SITE_GACHA_URL + code + '\n\n抽獎碼：' + code + '\n已購項目：' + (purchased.join('、') || '無'),
  };
}

function handleFormB(e, email) {
  var campaign = formValue(e, ['設定活動代號']).trim();
  var quotaText = formValue(e, ['設定活動名額']).trim();
  var customCode = normalizeCode(formValue(e, ['設定自訂碼']));
  if (!CAMPAIGN_PATTERN.test(campaign)) {
    return formFailure('設定活動代號格式有誤：請使用 2～32 個小寫英數或連字號，且不得以連字號開頭。');
  }
  if (customCode && !CODE_PATTERN.test(customCode)) {
    return formFailure('設定自訂碼格式有誤：請使用 3～32 個英數、底線或連字號。');
  }

  var quota = '';
  if (quotaText) {
    quota = Number(quotaText);
    if (!isFinite(quota) || Math.floor(quota) !== quota || quota <= 0 || quota > 100000) {
      return formFailure('設定活動名額須為 1～100000 的整數，或留空。');
    }
  }

  var codeTable = readTable(SHEET_NAMES.CODES, HEADERS.CODES);
  if (customCode && findCodeInTable(codeTable, customCode)) {
    return formFailure('抽獎碼「' + customCode + '」已存在，未建立公開碼。');
  }
  var code = customCode || generateUniqueCode(codeTable, 8);
  var values = emptyRow(HEADERS.CODES);
  values['抽獎碼'] = code;
  values['類型'] = '公開';
  values['活動代號'] = campaign;
  values['活動名額'] = quota;
  values['狀態'] = '啟用';
  values['發放日'] = new Date();
  values['發放人'] = email;
  values['抽獎連結'] = SITE_GACHA_URL + code;
  appendRow(codeTable, values);
  try { SpreadsheetApp.flush(); } catch (postCommitError) {}

  return {
    subject: '【星靈扭蛋】公開碼（' + campaign + '）已建立',
    body: '公開抽獎碼：' + code + '\n活動名額：' + (quota === '' ? '未填寫' : quota) + '\n\n活動連結：\n' + SITE_GACHA_URL + code + '\n\n額滿後請將此碼之狀態改為「停用」。',
  };
}

function handleFormC(e, email) {
  var drawId = formValue(e, ['客戶抽獎編號']).trim().toUpperCase();
  var status = formValue(e, ['客戶狀態']).trim();
  var note = formValue(e, ['客戶備註']).trim();
  if (!DRAW_ID_PATTERN.test(drawId)) return formFailure('客戶抽獎編號格式有誤，未更新任何紀錄。');
  if (RECORD_STATUSES.indexOf(status) === -1) return formFailure('客戶狀態不在允許選項內，未更新任何紀錄。');
  if (note.length > 500) return formFailure('客戶備註超過 500 字，請縮短後重新送出。');

  var table = readTable(SHEET_NAMES.DRAWS, HEADERS.DRAWS);
  var target = null;
  for (var i = 0; i < table.rows.length; i++) {
    if (cell(table, table.rows[i], '抽獎編號').toUpperCase() === drawId) {
      target = table.rows[i];
      break;
    }
  }
  if (!target) return formFailure('找不到抽獎編號「' + drawId + '」，未更新任何紀錄。');

  var acceptedAt = cell(table, target, '登記受理時間');
  var wasAccepted = acceptedAt !== '';
  if (wasAccepted && status === '已登記') {
    return formFailure('此編號已於 ' + formatDate(acceptedAt, 'yyyy/MM/dd HH:mm:ss') + ' 受理，處理狀態未變更。');
  }

  var submittedAt = formTimestamp(e);
  var updates = { '處理狀態': status };
  if (!wasAccepted) {
    updates['登記受理時間'] = submittedAt;
    updates['登記人'] = email;
  }
  if (note) {
    var previous = cell(table, target, '備註');
    var entry = formatDate(submittedAt, 'MM/dd HH:mm') + ' ' + email + '：' + note;
    updates['備註'] = plainText(previous ? previous + '\n' + entry : entry);
  }
  updateRow(table, target, updates);
  try { SpreadsheetApp.flush(); } catch (postCommitError) {}

  return {
    subject: '【星靈扭蛋】' + drawId + ' 已更新為' + status,
    body: '抽獎編號：' + drawId + '\n抽獎碼：' + cell(table, target, '抽獎碼') + '\n抽中項目：' + cell(table, target, '抽中項目') + '\n處理狀態：' + status + '\n登記受理時間：' + formatDate(cell(table, target, '登記受理時間'), 'yyyy/MM/dd HH:mm:ss'),
  };
}

function readTable(sheetName, requiredHeaders) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('找不到工作表：' + sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0].map(function (value) { return String(value).trim(); }) : [];
  var columns = {};
  headers.forEach(function (header, index) {
    if (header && columns[header] !== undefined) throw new Error(sheetName + ' 欄位標題重複：' + header);
    if (header) columns[header] = index;
  });
  requiredHeaders.forEach(function (header) {
    if (columns[header] === undefined) throw new Error(sheetName + ' 缺少欄位：' + header);
  });

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var hasValue = values[i].some(function (value) { return value !== ''; });
    if (hasValue) rows.push({ rowNumber: i + 1, values: values[i] });
  }
  return { sheet: sheet, headers: headers, columns: columns, rows: rows };
}

function cell(table, row, header) {
  var value = row.values[table.columns[header]];
  return value instanceof Date ? value : String(value == null ? '' : value).trim();
}

function updateRow(table, row, updates) {
  Object.keys(updates).forEach(function (header) {
    row.values[table.columns[header]] = updates[header];
  });
  table.sheet.getRange(row.rowNumber, 1, 1, row.values.length).setValues([row.values]);
}

function emptyRow(headers) {
  var values = {};
  headers.forEach(function (header) { values[header] = ''; });
  return values;
}

function appendRow(table, values) {
  var row = table.headers.map(function (header) {
    return values[header] === undefined ? '' : values[header];
  });
  table.sheet.appendRow(row);
}

function findCodeRow(code) {
  var table = readTable(SHEET_NAMES.CODES, HEADERS.CODES);
  return findCodeInTable(table, code);
}

function findCodeInTable(table, code) {
  for (var i = 0; i < table.rows.length; i++) {
    if (normalizeCode(cell(table, table.rows[i], '抽獎碼')) === code) return { table: table, row: table.rows[i] };
  }
  return null;
}

function findDrawByCode(code) {
  var table = readTable(SHEET_NAMES.DRAWS, HEADERS.DRAWS);
  for (var i = 0; i < table.rows.length; i++) {
    if (normalizeCode(cell(table, table.rows[i], '抽獎碼')) === code) return { table: table, row: table.rows[i] };
  }
  return null;
}

function generateUniqueCode(table, length) {
  var existing = {};
  table.rows.forEach(function (row) { existing[normalizeCode(cell(table, row, '抽獎碼'))] = true; });
  var code = '';
  do { code = randomCode(length); } while (existing[code]);
  return code;
}

function generateUniqueDrawId(table) {
  var existing = {};
  table.rows.forEach(function (row) { existing[cell(table, row, '抽獎編號')] = true; });
  var drawId = '';
  do { drawId = 'G-' + randomCode(10); } while (existing[drawId]);
  return drawId;
}

function randomCode(length) {
  var output = '';
  while (output.length < length) {
    var bytes = randomBytes();
    for (var i = 0; i < bytes.length && output.length < length; i++) {
      if (bytes[i] < 248) output += ALPHABET.charAt(bytes[i] % ALPHABET.length);
    }
  }
  return output;
}

function randomIndex(length) {
  var limit = Math.floor(256 / length) * length;
  while (true) {
    var value = randomBytes()[0];
    if (value < limit) return value % length;
  }
}

function randomBytes() {
  var uuid = Utilities.getUuid().replace(/-/g, '');
  var bytes = [];
  for (var i = 0; i < uuid.length; i += 2) bytes.push(parseInt(uuid.substring(i, i + 2), 16));
  return bytes;
}

function isRateLimited(cache, code) {
  var keys = rateKeys(code);
  return Number(cache.get(keys.short)) >= 10 || Number(cache.get(keys.hour)) >= 200;
}

function incrementRateLimits(cache, code) {
  var keys = rateKeys(code);
  cache.put(keys.short, String((Number(cache.get(keys.short)) || 0) + 1), 10);
  cache.put(keys.hour, String((Number(cache.get(keys.hour)) || 0) + 1), 3600);
}

function rateKeys(code) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, code, Utilities.Charset.UTF_8);
  var hash = digest.map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
  return { short: 'gacha_short_' + hash, hour: 'gacha_hour_' + hash };
}

function isAuthorized(email) {
  var table = readTable(SHEET_NAMES.AUTH, HEADERS.AUTH);
  var normalized = email.toLowerCase();
  return table.rows.some(function (row) { return cell(table, row, 'email').toLowerCase() === normalized; });
}

function formValue(e, names) {
  var values = e && e.namedValues ? e.namedValues : {};
  for (var i = 0; i < names.length; i++) {
    if (Object.prototype.hasOwnProperty.call(values, names[i])) {
      var value = values[names[i]];
      return Array.isArray(value) ? value.join('、') : String(value == null ? '' : value);
    }
  }
  return '';
}

function formTimestamp(e) {
  if (e && e.range) {
    var value = e.range.getSheet().getRange(e.range.getRow(), 1).getValue();
    if (value instanceof Date && !isNaN(value.getTime())) return value;
  }
  return new Date();
}

function formFailure(message) {
  return { subject: '【星靈扭蛋】操作未執行', body: message };
}

function parseList(value) {
  var text = value instanceof Date ? '' : String(value == null ? '' : value);
  var seen = {};
  return text.split(/[、，,;；\n]/).map(function (item) { return item.trim(); }).filter(function (item) {
    if (!item || seen[item]) return false;
    seen[item] = true;
    return true;
  });
}

function normalizeCode(value) {
  return String(value == null ? '' : value).trim().toUpperCase();
}

function plainText(value) {
  var text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function formatDate(value, pattern) {
  var date = value instanceof Date ? value : new Date(value);
  return !isNaN(date.getTime()) ? Utilities.formatDate(date, TIME_ZONE, pattern) : '';
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
