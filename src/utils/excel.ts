import * as Excel from "exceljs";

// ref: https://stackoverflow.com/q/55132760/10089156
export async function createExcel(option: any) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(option.page);

    worksheet.columns = option.headers 

    for(let row of option.rows){
        worksheet.addRow(row);
    }

    await workbook.xlsx.writeFile(option.filePath);
}