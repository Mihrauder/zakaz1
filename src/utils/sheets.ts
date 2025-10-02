import { google, sheets_v4 } from "googleapis";
import { assertServerOnly, getOptionalServerEnv, requireServerEnv } from "@/utils/env";

function getAuth() {
  assertServerOnly("sheets");
  const clientEmail = getOptionalServerEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = (getOptionalServerEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    return null;
  }
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  const auth = getAuth();
  if (!auth) return null;
  return google.sheets({ version: "v4", auth });
}

export type SheetRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
];

export async function appendApplicationRow(row: SheetRow): Promise<number | null> {
  console.log("[Sheets] appendApplicationRow called with row:", row);
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[Sheets] No sheets client available for append");
    return null;
  }
  const spreadsheetId = requireServerEnv("GOOGLE_SHEETS_ID");
  const rangeBase = getOptionalServerEnv("GOOGLE_SHEETS_RANGE", "A:J");
  const sheetName = (rangeBase.includes("!") ? rangeBase.split("!")[0] : "Sheet1");
  const range = `${sheetName}!A:J`;
  console.log("[Sheets] Appending to range:", range, "spreadsheetId:", spreadsheetId);
  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
    console.log("[Sheets] Append response:", res.data);
    const updatedRange = res.data.updates?.updatedRange; // e.g., 'Sheet1!A5:H5'
    if (!updatedRange) {
      console.log("[Sheets] No updatedRange in response");
      return null;
    }
    const match = updatedRange.match(/!(?:[A-Z]+)(\d+):/);
    const rowNumber = match ? Number(match[1]) : null;
    console.log("[Sheets] Extracted row number:", rowNumber);
    return rowNumber;
  } catch (error) {
    console.log("[Sheets] Append failed:", error);
    return null;
  }
}

export async function findApplicationRow(appId: string): Promise<number | null> {
  console.log("[Sheets] findApplicationRow called with appId:", appId);
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[Sheets] No sheets client available for find");
    return null;
  }
  const spreadsheetId = requireServerEnv("GOOGLE_SHEETS_ID");
  const rangeBase = getOptionalServerEnv("GOOGLE_SHEETS_RANGE", "A:I");
  const sheetName = (rangeBase.includes("!") ? rangeBase.split("!")[0] : "Sheet1");
  const range = `${sheetName}!A:A`; // Search only in column A for app IDs
  console.log("[Sheets] Searching in range:", range, "spreadsheetId:", spreadsheetId);
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const values = res.data.values || [];
    console.log("[Sheets] Found values:", values);
    for (let i = 0; i < values.length; i++) {
      const cellValue = values[i][0];
      if (cellValue === `#${appId}`) {
        const rowNumber = i + 1; // Convert to 1-based row number
        console.log("[Sheets] Found app ID at row:", rowNumber);
        return rowNumber;
      }
    }
    console.log("[Sheets] App ID not found in sheets");
    return null;
  } catch (error) {
    console.log("[Sheets] Find failed:", error);
    return null;
  }
}

export async function checkDuplicatePhoneInSheets(phone: string): Promise<boolean> {
  console.log("[Sheets] checkDuplicatePhoneInSheets called with phone:", phone);
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[Sheets] No sheets client available for checkDuplicatePhoneInSheets");
    return false;
  }
  const spreadsheetId = requireServerEnv("GOOGLE_SHEETS_ID");
  const rangeBase = getOptionalServerEnv("GOOGLE_SHEETS_RANGE", "A:I");
  const sheetName = (rangeBase.includes("!") ? rangeBase.split("!")[0] : "Sheet1");
  const range = `${sheetName}!D:D`; // Search in column D for phone numbers
  console.log("[Sheets] Checking duplicates in range:", range, "spreadsheetId:", spreadsheetId);
  
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const values = res.data.values || [];
    console.log("[Sheets] Found phone values:", values);
    
    const normalizedPhone = phone.replace(/\D/g, "");
    
    for (let i = 0; i < values.length; i++) {
      const cellValue = values[i][0];
      if (!cellValue) continue;
      const sheetPhone = cellValue.startsWith("'") ? cellValue.substring(1) : cellValue;
      const normalizedSheetPhone = sheetPhone.replace(/\D/g, "");
      if (normalizedSheetPhone === normalizedPhone) {
        console.log("[Sheets] Found duplicate phone at row:", i + 1);
        return true;
      }
    }
    console.log("[Sheets] No duplicate phone found");
    return false;
  } catch (error) {
    console.log("[Sheets] checkDuplicatePhoneInSheets failed:", error);
    return false;
  }
}

export async function getNextApplicationNumber(): Promise<number> {
  console.log("[Sheets] getNextApplicationNumber called");
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[Sheets] No sheets client available for getNextApplicationNumber");
    return 1;
  }
  const spreadsheetId = requireServerEnv("GOOGLE_SHEETS_ID");
  const rangeBase = getOptionalServerEnv("GOOGLE_SHEETS_RANGE", "A:I");
  const sheetName = (rangeBase.includes("!") ? rangeBase.split("!")[0] : "Sheet1");
  const range = `${sheetName}!A:A`; // Search in column A for app IDs
  console.log("[Sheets] Getting next number from range:", range, "spreadsheetId:", spreadsheetId);
  
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const values = res.data.values || [];
    console.log("[Sheets] Found app ID values:", values);
    
    let maxNumber = 0;
    for (let i = 0; i < values.length; i++) {
      const cellValue = values[i][0];
      if (cellValue && cellValue.startsWith("#")) {
        const appId = cellValue.substring(1); // Remove #
        const number = parseInt(appId, 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    }
    const nextNumber = maxNumber + 1;
    console.log("[Sheets] Next application number:", nextNumber);
    return nextNumber;
  } catch (error) {
    console.log("[Sheets] getNextApplicationNumber failed:", error);
    return 1;
  }
}

export async function findApplicationInSheets(appId: string): Promise<{rowNumber: number, data: string[]} | null> {
  console.log("[Sheets] findApplicationInSheets called with appId:", appId);
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[Sheets] No sheets client available for findApplicationInSheets");
    return null;
  }
  const spreadsheetId = requireServerEnv("GOOGLE_SHEETS_ID");
  const rangeBase = getOptionalServerEnv("GOOGLE_SHEETS_RANGE", "A:J");
  const sheetName = (rangeBase.includes("!") ? rangeBase.split("!")[0] : "Sheet1");
  const range = `${sheetName}!A:J`; // Get all data
  console.log("[Sheets] Searching for app in range:", range, "spreadsheetId:", spreadsheetId);
  
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const values: string[][] = (res.data.values as string[][]) || [];
    console.log("[Sheets] Found values:", values);
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (row && row[0] === `#${appId}`) {
        const rowNumber = i + 1; // Convert to 1-based row number
        console.log("[Sheets] Found app at row:", rowNumber, "data:", row);
        return { rowNumber, data: row };
      }
    }
    console.log("[Sheets] App not found in sheets");
    return null;
  } catch (error) {
    console.log("[Sheets] findApplicationInSheets failed:", error);
    return null;
  }
}

export async function updateApplicationRowNumbers(applications: Array<{id: string, sheetRow?: number}>): Promise<boolean> {
  console.log("[Sheets] updateApplicationRowNumbers called with applications:", applications);
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[Sheets] No sheets client available for updateApplicationRowNumbers");
    return false;
  }
  const spreadsheetId = requireServerEnv("GOOGLE_SHEETS_ID");
  const rangeBase = getOptionalServerEnv("GOOGLE_SHEETS_RANGE", "A:I");
  const sheetName = (rangeBase.includes("!") ? rangeBase.split("!")[0] : "Sheet1");
  
  try {
    for (const app of applications) {
      if (app.sheetRow) {
        const range = `${sheetName}!A${app.sheetRow}`;
        console.log("[Sheets] Updating ID in range:", range, "to:", `#${app.id}`);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: "RAW",
          requestBody: { values: [[`#${app.id}`]] },
        });
      }
    }
    console.log("[Sheets] All application IDs updated successfully");
    return true;
  } catch (error) {
    console.log("[Sheets] updateApplicationRowNumbers failed:", error);
    return false;
  }
}

export async function updateApplicationRow(rowNumber: number, row: SheetRow): Promise<boolean> {
  console.log("[Sheets] updateApplicationRow called with rowNumber:", rowNumber, "row:", row);
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[Sheets] No sheets client available");
    return false;
  }
  const spreadsheetId = requireServerEnv("GOOGLE_SHEETS_ID");
  const rangeBase = getOptionalServerEnv("GOOGLE_SHEETS_RANGE", "A:J"); // we will override row
  const sheetName = (rangeBase.includes("!") ? rangeBase.split("!")[0] : "Sheet1");
  const range = `${sheetName}!A${rowNumber}:J${rowNumber}`;
  console.log("[Sheets] Updating range:", range, "spreadsheetId:", spreadsheetId);
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
    console.log("[Sheets] Update successful");
    return true;
  } catch (error) {
    console.log("[Sheets] Update failed:", error);
    return false;
  }
}


