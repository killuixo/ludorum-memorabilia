const SHEET_FINISHED = 'Games Finalizados';
const SHEET_BACKLOG = 'Games que quero jogar';

const HEADER_MAP = {
  '#': 'ordem',
  'ordem': 'ordem',
  'nome': 'titulo', 
  'titulo': 'titulo',
  'jogo': 'titulo',
  'game': 'titulo',
  'console': 'plataforma', 
  'plataforma': 'plataforma',
  'genero': 'franquia', 
  'franquia': 'franquia',
  'inicio': 'inicio', 
  'iniciado': 'inicio',
  'fim': 'fim', 
  'termino': 'fim',
  'tempo': 'tempo',
  'nota': 'nota',
  'dificuldade': 'dificuldade',
  'condicao': 'conquistas', 
  'conquistas': 'conquistas',
  'link': 'midia', 
  'midia': 'midia',
  'observacao': 'comentarios', 
  'comentarios': 'comentarios',
  'preco pago': 'preco', 
  'preco': 'preco',
  'preco sem desconto': 'preco_original', 
  'suporte': 'suporte',
  'prioridade': 'prioridade'
};

function normalizeHeader(h) {
  if (!h) return null;
  let cleaned = String(h)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return HEADER_MAP[cleaned] || cleaned;
}

function doGet(e) {
  try {
    let result = { finished: [], backlog: [] };
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let sheetFin = ss.getSheetByName(SHEET_FINISHED);
    if(sheetFin) result.finished = extractData(sheetFin, 'Finalizado');
    
    let sheetBack = ss.getSheetByName(SHEET_BACKLOG);
    if(sheetBack) result.backlog = extractData(sheetBack, 'Backlog');
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function extractData(sheet, statusStr) {
  let range = sheet.getDataRange();
  let values = range.getValues();
  let displayValues = range.getDisplayValues(); 
  
  if(values.length < 2) return [];
  
  let headers = values[0].map(normalizeHeader);
  let rows = [];
  
  for(let i = 1; i < values.length; i++) {
    let rowVal = values[i];
    let rowDisp = displayValues[i];
    let obj = {};
    let hasTitle = false;
    
    for(let j = 0; j < headers.length; j++) {
      let key = headers[j];
      if (key) {
        let val = (rowDisp[j] !== undefined && rowDisp[j] !== "") ? rowDisp[j] : rowVal[j];
        obj[key] = val;
        if (key === 'titulo' && val) hasTitle = true;
      }
    }
    
    if (!hasTitle && statusStr === 'Backlog' && rowDisp[0]) {
       obj['titulo'] = rowDisp[0] !== "" ? rowDisp[0] : rowVal[0];
       hasTitle = true;
    }
    
    if(hasTitle) {
      obj.id = sheet.getName() + '|' + (i + 1); 
      obj.status = statusStr;
      rows.push(obj);
    }
  }
  return rows;
}

function doPost(e) {
  try {
    let payload = JSON.parse(e.postData.contents);
    let action = payload.action;
    let data = payload.data;
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'ADD') {
      let targetSheetName = data.status === 'Finalizado' ? SHEET_FINISHED : SHEET_BACKLOG;
      let targetSheet = ss.getSheetByName(targetSheetName);
      if(!targetSheet) throw new Error("Aba " + targetSheetName + " não encontrada.");
      addRowTopSafe(targetSheet, data);
    } 
    else if (action === 'UPDATE') {
      let parts = String(data.id).split('|');
      let sheetName = parts[0];
      let rowNum = parseInt(parts[1]);
      
      let currentSheet = ss.getSheetByName(sheetName);
      let targetSheetName = data.status === 'Finalizado' ? SHEET_FINISHED : SHEET_BACKLOG;
      
      if (sheetName !== targetSheetName) {
        let targetSheet = ss.getSheetByName(targetSheetName);
        addRowTopSafe(targetSheet, data);
        currentSheet.deleteRow(rowNum);
      } else {
        updateRowSafe(currentSheet, rowNum, data);
      }
    }
    else if (action === 'DELETE') {
      let parts = String(payload.id).split('|');
      let sheetName = parts[0];
      let rowNum = parseInt(parts[1]);
      let sheet = ss.getSheetByName(sheetName);
      if(sheet) sheet.deleteRow(rowNum);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function parseInputDate(val) {
  if (typeof val === 'string') {
     let s = val.trim();
     let brMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
     if (brMatch) {
        return new Date(parseInt(brMatch[3]), parseInt(brMatch[2]) - 1, parseInt(brMatch[1]), 12, 0, 0);
     }
     let isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
     if (isoMatch) {
        return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]), 12, 0, 0);
     }
  }
  return val;
}

function addRowTopSafe(sheet, data) {
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let mappedHeaders = headers.map(normalizeHeader);
  let sheetName = sheet.getName();
  
  sheet.insertRowBefore(2); 

  for(let i=0; i<headers.length; i++) {
    let key = mappedHeaders[i];
    
    if (sheetName === SHEET_FINISHED && (!key || key === 'ordem' || key === '#')) continue;
    if (sheetName === SHEET_BACKLOG && i === 0) key = 'titulo';

    if (data[key] !== undefined && data[key] !== "") {
       let valToWrite = parseInputDate(data[key]);
       sheet.getRange(2, i + 1).setValue(valToWrite); 
    }
  }
}

function updateRowSafe(sheet, rowNum, data) {
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let mappedHeaders = headers.map(normalizeHeader);
  let sheetName = sheet.getName();
  
  for(let i=0; i<headers.length; i++) {
    let key = mappedHeaders[i];
    
    if (sheetName === SHEET_FINISHED && (!key || key === 'ordem' || key === '#')) continue;
    if (sheetName === SHEET_BACKLOG && i === 0) key = 'titulo';

    if (data[key] !== undefined) {
       let valToWrite = parseInputDate(data[key]);
       if (data[key] === "") valToWrite = "";
       sheet.getRange(rowNum, i + 1).setValue(valToWrite);
    }
  }
}
